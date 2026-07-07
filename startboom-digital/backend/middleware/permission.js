// middleware/permission.js
import Permission from '../models/Permission.js';

/**
 * Middleware to check if user has permission to perform an action on a module
 * Usage: router.get('/clients', auth, checkPermission('clients', 'view'), getClients)
 */
export const checkPermission = (module, action) => {
  return async (req, res, next) => {
    try {
      const { user } = req;
      
      if (!user) {
        return res.status(401).json({ 
          message: 'Authentication required' 
        });
      }
      
      // Superadmin bypasses all permission checks
      if (user.role === 'superadmin') {
        req.userPermissions = {
          [module]: {
            view: true,
            create: true,
            edit: true,
            delete: true,
            export: true,
            import: true,
            viewAll: true,
            approve: true,
            assignOwnership: true
          }
        };
        return next();
      }
      
      // Get user's permissions for this module
      const permission = await Permission.findOne({
        tenant: user.tenant,
        role: user.role,
        module: module,
        isActive: true,
        $or: [
          { department: null }, // Global permission
          { department: user.department } // Department-specific
        ]
      }).sort({ department: -1 }); // Department-specific takes precedence
      
      // No permission found
      if (!permission) {
        return res.status(403).json({ 
          message: `Access denied. You don't have permission to access ${module}` 
        });
      }
      
      // Check if the specific action is allowed
      if (!permission.actions[action]) {
        return res.status(403).json({ 
          message: `Access denied. You cannot ${action} ${module}` 
        });
      }
      
      // Attach permissions to request for use in controllers
      req.userPermissions = {
        [module]: permission.actions
      };
      
      // Attach scope level for query filtering
      req.permissionScope = permission.getScopeLevel();
      
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ 
        message: 'Error checking permissions',
        error: error.message 
      });
    }
  };
};

/**
 * Middleware to check multiple permissions at once
 * Usage: router.get('/dashboard', auth, checkPermissions([
 *   {module: 'clients', action: 'view'},
 *   {module: 'deals', action: 'view'}
 * ]), getDashboard)
 */
export const checkPermissions = (permissionChecks) => {
  return async (req, res, next) => {
    try {
      const { user } = req;
      
      if (!user) {
        return res.status(401).json({ 
          message: 'Authentication required' 
        });
      }
      
      // Superadmin bypasses
      if (user.role === 'superadmin') {
        req.userPermissions = {};
        permissionChecks.forEach(check => {
          req.userPermissions[check.module] = { viewAll: true };
        });
        return next();
      }
      
      // Check all permissions
      const modules = [...new Set(permissionChecks.map(p => p.module))];
      const permissions = await Permission.find({
        tenant: user.tenant,
        role: user.role,
        module: { $in: modules },
        isActive: true,
        $or: [
          { department: null },
          { department: user.department }
        ]
      });
      
      // Build permission map
      const permissionMap = {};
      permissions.forEach(perm => {
        permissionMap[perm.module] = perm.actions;
      });
      
      // Verify all required permissions
      for (const check of permissionChecks) {
        const perm = permissionMap[check.module];
        if (!perm || !perm[check.action]) {
          return res.status(403).json({ 
            message: `Access denied. Missing permission: ${check.action} on ${check.module}` 
          });
        }
      }
      
      req.userPermissions = permissionMap;
      next();
    } catch (error) {
      console.error('Permissions check error:', error);
      return res.status(500).json({ 
        message: 'Error checking permissions',
        error: error.message 
      });
    }
  };
};

/**
 * Middleware to get all user permissions (for frontend use)
 */
export const loadUserPermissions = async (req, res, next) => {
  try {
    const { user } = req;
    
    if (!user) {
      return next();
    }
    
    // Superadmin gets everything
    if (user.role === 'superadmin') {
      req.allPermissions = { all: true };
      return next();
    }
    
    const permissions = await Permission.getUserPermissions(user);
    req.allPermissions = permissions;
    
    next();
  } catch (error) {
    console.error('Load permissions error:', error);
    next(); // Continue even if permission loading fails
  }
};

export default { checkPermission, checkPermissions, loadUserPermissions };
