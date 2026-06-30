import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Tenant from '../models/Tenant.js';
import Subscription from '../models/Subscription.js';

/**
 * Tenant-Aware Authentication Middleware
 * 
 * This middleware:
 * 1. Verifies JWT token
 * 2. Loads user with tenant information
 * 3. Ensures tenant is active
 * 4. Adds tenant context to request
 * 5. Handles super-admin special cases
 */
export const tenantAuth = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Access denied. No valid token provided.',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    } catch (error) {
      return res.status(401).json({ 
        message: 'Invalid or expired token.',
        code: 'INVALID_TOKEN'
      });
    }

    // Load user with tenant information
    const user = await User.findById(decoded.userId)
      .populate('tenant')
      .populate('customRole')
      .select('-password -otp');

    if (!user) {
      return res.status(401).json({ 
        message: 'User not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if user account is active
    if (user.isActive === false) {
      return res.status(403).json({ 
        message: 'Account has been deactivated. Please contact your administrator.',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Handle platform roles without tenant restrictions
    if (user.role === 'superadmin' || user.role === 'manager') {
      req.user = {
        userId: user._id,
        email: user.email,
        role: user.role,
        tenantId: null,
        name: user.name
      };
      req.tenant = null;
      req.isSuperAdmin = user.role === 'superadmin';
      req.isPlatformManager = user.role === 'manager';
      req.tenantQuery = {}; // Super admin sees all data
      req.canAddUsers = () => true;
      req.canAddClients = () => true;
      req.canAddDeals = () => true;
      req.updateTenantUsage = async () => {}; // No-op for super admin
      return next();
    }

    // Regular users must have a tenant
    if (!user.tenant) {
      return res.status(403).json({ 
        message: 'User is not associated with any organization. Please contact support.',
        code: 'NO_TENANT'
      });
    }

    // Check if tenant is active
    if (user.tenant.status !== 'active' && user.tenant.status !== 'trial') {
      return res.status(403).json({ 
        message: 'Organization account is suspended. Please contact your administrator.',
        code: 'TENANT_SUSPENDED'
      });
    }

    if (user.tenant.metadata?.lockdownMode) {
      return res.status(403).json({
        message: 'Organization is in emergency lockdown mode. Please contact your administrator.',
        code: 'TENANT_LOCKDOWN'
      });
    }

    // Check if trial has expired
    if (user.tenant.status === 'trial' && user.tenant.isTrialExpired) {
      return res.status(403).json({ 
        message: 'Trial period has expired. Please upgrade your subscription.',
        code: 'TRIAL_EXPIRED'
      });
    }

    // Add user and tenant context to request
    req.user = {
      userId: user._id,
      email: user.email,
      role: user.role,
      customRole: user.customRole,
      tenantId: user.tenant._id,
      name: user.name
    };
    req.tenant = user.tenant;
    req.tenantId = user.tenant._id;
    req.isSuperAdmin = false;

    // Tenant-scoped query filter helper
    req.tenantQuery = { tenant: user.tenant._id };

    // Usage check helpers
    req.canAddUsers = () => user.tenant.canAddUser();
    req.canAddClients = () => user.tenant.canAddClient();
    req.canAddDeals = () => user.tenant.canAddDeal();

    // Usage update helper
    req.updateTenantUsage = async (resource, increment) => {
      const fieldMap = {
        users: 'usage.totalUsers',
        clients: 'usage.totalClients',
        deals: 'usage.totalDeals'
      };
      const field = fieldMap[resource];
      if (field) {
        await Tenant.findByIdAndUpdate(user.tenant._id, {
          $inc: { [field]: increment },
          'usage.lastActivity': new Date()
        });
      }
    };

    next();
  } catch (error) {
    console.error('Tenant auth middleware error:', error);
    res.status(500).json({ 
      message: 'Authentication service error.',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
};

/**
 * Role-Based Access Control Middleware
 * 
 * Ensures user has required role(s) to access endpoint
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    // Super admin has access to everything
    if (req.isSuperAdmin) {
      return next();
    }

    // Check if user has required role
    const userRole = req.user.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        code: 'INSUFFICIENT_ROLE'
      });
    }

    next();
  };
};

/**
 * Super Admin Only Middleware
 * 
 * Restricts access to super admin only
 */
export const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required.',
      code: 'AUTH_REQUIRED'
    });
  }

  if (!req.isSuperAdmin) {
    return res.status(403).json({ 
      message: 'Access denied. Super admin privileges required.',
      code: 'SUPER_ADMIN_REQUIRED'
    });
  }

  next();
};

/**
 * Feature Access Middleware
 * 
 * Checks if tenant's subscription allows access to specific features
 */
export const requireFeature = (featureName) => {
  return async (req, res, next) => {
    // Super admin bypasses feature restrictions
    if (req.isSuperAdmin) {
      return next();
    }

    if (!req.tenant) {
      return res.status(403).json({ 
        message: 'Tenant context required.',
        code: 'NO_TENANT_CONTEXT'
      });
    }

    try {
      const tenant = await Tenant.findById(req.tenantId).populate('subscription');
      
      if (!tenant) {
        return res.status(403).json({ 
          message: 'Tenant not found.',
          code: 'TENANT_NOT_FOUND'
        });
      }

      // Check if feature is enabled
      const hasFeature = tenant.hasFeature(featureName);
      
      if (!hasFeature) {
        return res.status(403).json({ 
          message: `Feature '${featureName}' is not available in your current plan. Please upgrade.`,
          code: 'FEATURE_NOT_AVAILABLE',
          feature: featureName
        });
      }

      next();
    } catch (error) {
      console.error('Feature access check error:', error);
      res.status(500).json({ 
        message: 'Feature access service error.',
        code: 'FEATURE_SERVICE_ERROR'
      });
    }
  };
};

/**
 * Usage Limit Middleware
 * 
 * Checks if tenant has reached usage limits for specific resources
 */
export const checkUsageLimit = (resourceType) => {
  return async (req, res, next) => {
    // Super admin bypasses usage limits
    if (req.isSuperAdmin) {
      return next();
    }

    if (!req.tenant) {
      return res.status(403).json({ 
        message: 'Tenant context required.',
        code: 'NO_TENANT_CONTEXT'
      });
    }

    try {
      const tenant = await Tenant.findById(req.tenantId).populate('subscription');
      
      if (!tenant) {
        return res.status(403).json({ 
          message: 'Tenant not found.',
          code: 'TENANT_NOT_FOUND'
        });
      }

      // Check usage limits based on resource type
      let canAdd = false;
      let currentUsage = 0;
      let limit = 0;

      switch (resourceType) {
        case 'users':
          currentUsage = tenant.usage.totalUsers || 0;
          limit = tenant.subscription?.features?.maxUsers || tenant.settings?.features?.maxUsers || 250;
          canAdd = currentUsage < limit;
          break;
        case 'clients':
          currentUsage = tenant.usage.totalClients || 0;
          limit = tenant.subscription?.features?.maxClients || tenant.settings?.features?.maxClients || 1000;
          canAdd = currentUsage < limit;
          break;
        case 'deals':
          currentUsage = tenant.usage.totalDeals || 0;
          limit = tenant.subscription?.features?.maxDeals || tenant.settings?.features?.maxDeals || 500;
          canAdd = currentUsage < limit;
          break;
        default:
          return next();
      }

      if (!canAdd) {
        return res.status(403).json({ 
          message: `Usage limit reached. You have ${currentUsage}/${limit} ${resourceType}. Please upgrade your plan.`,
          code: 'USAGE_LIMIT_REACHED',
          resourceType,
          currentUsage,
          limit
        });
      }

      next();
    } catch (error) {
      console.error('Usage limit check error:', error);
      res.status(500).json({ 
        message: 'Usage limit service error.',
        code: 'USAGE_SERVICE_ERROR'
      });
    }
  };
};

/**
 * Tenant Query Filter Helper
 * 
 * Adds tenant filter to MongoDB queries automatically
 */
export const addTenantFilter = (req, baseQuery = {}) => {
  // Platform roles can see all data (no tenant filter)
  if (req.isSuperAdmin || req.isPlatformManager) {
    return baseQuery;
  }

  // Add tenant filter for regular users
  return {
    ...baseQuery,
    tenant: req.tenantId
  };
};

/**
 * Tenant Data Injection Helper
 * 
 * Automatically adds tenant ID to data being created
 */
export const addTenantData = (req, data = {}) => {
  // Super admin must explicitly specify tenant
  if (req.isSuperAdmin) {
    return data; // Don't auto-add tenant for super admin
  }

  // Add tenant ID for regular users
  return {
    ...data,
    tenant: req.tenantId
  };
};

/**
 * Granular Permission Middleware
 * 
 * Ensures user has a specific permission string (e.g., 'clients:write')
 * Admins automatically have all permissions.
 */
export const requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    // Super admin and tenant admins have full access
    if (req.isSuperAdmin || req.user.role === 'admin') {
      return next();
    }

    // If user has a custom role, check its permissions array
    if (req.user.customRole && Array.isArray(req.user.customRole.permissions)) {
      if (req.user.customRole.permissions.includes(requiredPermission) || req.user.customRole.permissions.includes('*')) {
        return next();
      }
    }

    return res.status(403).json({ 
      message: `Access denied. Missing permission: ${requiredPermission}`,
      code: 'INSUFFICIENT_PERMISSION'
    });
  };
};

