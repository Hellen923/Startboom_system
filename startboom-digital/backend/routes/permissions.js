import express from 'express';
import Permission from '../models/Permission.js';
import { tenantAuth } from '../middleware/tenantAuth.js';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

// Apply tenant authentication
router.use(tenantAuth);


// Apply tenant authentication
router.use(tenantAuth);

/**
 * GET /api/permissions
 * Fetch permissions for a specific role
 * Query params: role (required)
 */
router.get('/', async (req, res) => {
  try {
    const { role } = req.query;
    
    if (!role) {
      return res.status(400).json({ message: 'Role parameter is required' });
    }

    // Fetch all permissions for this role and tenant
    const permissions = await Permission.find({
      tenant: req.tenantId,
      role: role
    }).lean();

    res.json({ 
      permissions,
      role,
      count: permissions.length 
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * POST /api/permissions/bulk
 * Save/update multiple permissions at once
 * Body: { role, permissions: [{ module, role, actions }] }
 */
router.post('/bulk', async (req, res) => {
  try {
    const { role, permissions } = req.body;

    if (!role || !Array.isArray(permissions)) {
      return res.status(400).json({ 
        message: 'Role and permissions array are required' 
      });
    }

    // Check admin permission
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const session = await Permission.startSession();
    const savedPermissions = [];

    try {
      await session.withTransaction(async () => {
        // Delete existing permissions for this role
        await Permission.deleteMany({
          tenant: req.tenantId,
          role: role
        }, { session });

        // Insert new permissions
        const permissionDocs = permissions.map(perm => ({
          tenant: req.tenantId,
          role: role,
          module: perm.module,
          actions: perm.actions || {}
        }));

        const created = await Permission.insertMany(permissionDocs, { session });
        savedPermissions.push(...created);
      });

      // Create audit log
      await AuditLog.create({
        action: 'UPDATE_PERMISSION',
        description: `Bulk permission update for role: ${role}`,
        user: req.user.userId,
        userName: req.user.name || '',
        userEmail: req.user.email || '',
        userRole: req.user.role,
        tenant: req.tenantId,
        entityType: 'Permission',
        status: 'success',
        metadata: { 
          role, 
          modulesUpdated: permissions.length,
          modules: permissions.map(p => p.module)
        }
      });

      res.json({ 
        message: 'Permissions saved successfully',
        permissions: savedPermissions,
        count: savedPermissions.length
      });
    } catch (error) {
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Error saving permissions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/permissions/roles
 * Get all available roles with their permission counts
 */
router.get('/roles', async (req, res) => {
  try {
    const roles = ['manager', 'agent', 'finance_staff', 'hr_staff', 'support_staff'];
    
    const roleCounts = await Promise.all(
      roles.map(async (role) => {
        const count = await Permission.countDocuments({
          tenant: req.tenantId,
          role: role
        });
        return { role, permissionCount: count };
      })
    );

    res.json({ roles: roleCounts });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/permissions/module/:module
 * Get permissions for a specific module across all roles
 */
router.get('/module/:module', async (req, res) => {
  try {
    const { module } = req.params;

    const permissions = await Permission.find({
      tenant: req.tenantId,
      module: module
    }).lean();

    res.json({ 
      module,
      permissions,
      count: permissions.length 
    });
  } catch (error) {
    console.error('Error fetching module permissions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * DELETE /api/permissions/role/:role
 * Delete all permissions for a specific role
 */
router.delete('/role/:role', async (req, res) => {
  try {
    const { role } = req.params;

    // Check admin permission
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const result = await Permission.deleteMany({
      tenant: req.tenantId,
      role: role
    });

    // Create audit log
    await AuditLog.create({
      action: 'DELETE',
      description: `Deleted all permissions for role: ${role}`,
      user: req.user.userId,
      userName: req.user.name || '',
      userEmail: req.user.email || '',
      userRole: req.user.role,
      tenant: req.tenantId,
      entityType: 'Permission',
      status: 'success',
      metadata: { role, deletedCount: result.deletedCount }
    });

    res.json({ 
      message: 'Permissions deleted successfully',
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Error deleting permissions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
