import express from 'express';
import Permission from '../models/Permission.js';
import { tenantAuth, requireRole } from '../middleware/tenantAuth.js';

const router = express.Router();

// Get all permissions (filtered by query params)
router.get('/', tenantAuth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { role, department, module } = req.query;
    
    const query = { tenant: req.tenantId };
    if (role) query.role = role;
    if (department) query.department = department;
    if (module) query.module = module;
    
    const permissions = await Permission.find(query)
      .populate('department', 'name')
      .sort({ role: 1, module: 1 });
    
    res.json({ permissions });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ message: 'Failed to fetch permissions', error: error.message });
  }
});

// Get permission by ID
router.get('/:id', tenantAuth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const permission = await Permission.findOne({
      _id: req.params.id,
      tenant: req.tenantId
    }).populate('department', 'name');
    
    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }
    
    res.json({ permission });
  } catch (error) {
    console.error('Error fetching permission:', error);
    res.status(500).json({ message: 'Failed to fetch permission', error: error.message });
  }
});

// Create or update permission
router.post('/', tenantAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { role, department, module, actions, restrictions, fieldPermissions } = req.body;
    
    // Validation
    if (!role || !module) {
      return res.status(400).json({ message: 'Role and module are required' });
    }
    
    // Check if permission already exists
    const existingPermission = await Permission.findOne({
      tenant: req.tenantId,
      role,
      module,
      department: department || null
    });
    
    if (existingPermission) {
      // Update existing permission
      existingPermission.actions = { ...existingPermission.actions, ...actions };
      if (restrictions) existingPermission.restrictions = restrictions;
      if (fieldPermissions) existingPermission.fieldPermissions = fieldPermissions;
      existingPermission.updatedBy = req.user._id;
      
      await existingPermission.save();
      
      return res.json({
        message: 'Permission updated successfully',
        permission: existingPermission
      });
    }
    
    // Create new permission
    const permission = new Permission({
      tenant: req.tenantId,
      role,
      department: department || null,
      module,
      actions: actions || {},
      restrictions: restrictions || {},
      fieldPermissions: fieldPermissions || {},
      createdBy: req.user._id,
      updatedBy: req.user._id
    });
    
    await permission.save();
    
    res.status(201).json({
      message: 'Permission created successfully',
      permission
    });
  } catch (error) {
    console.error('Error creating/updating permission:', error);
    res.status(500).json({ message: 'Failed to save permission', error: error.message });
  }
});

// Update permission
router.put('/:id', tenantAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { actions, restrictions, fieldPermissions, isActive } = req.body;
    
    const permission = await Permission.findOne({
      _id: req.params.id,
      tenant: req.tenantId
    });
    
    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }
    
    // Update fields
    if (actions) permission.actions = { ...permission.actions, ...actions };
    if (restrictions) permission.restrictions = restrictions;
    if (fieldPermissions) permission.fieldPermissions = fieldPermissions;
    if (typeof isActive !== 'undefined') permission.isActive = isActive;
    permission.updatedBy = req.user._id;
    
    await permission.save();
    
    res.json({
      message: 'Permission updated successfully',
      permission
    });
  } catch (error) {
    console.error('Error updating permission:', error);
    res.status(500).json({ message: 'Failed to update permission', error: error.message });
  }
});

// Delete permission
router.delete('/:id', tenantAuth, requireRole(['admin']), async (req, res) => {
  try {
    const permission = await Permission.findOne({
      _id: req.params.id,
      tenant: req.tenantId
    });
    
    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }
    
    await permission.deleteOne();
    
    res.json({ message: 'Permission deleted successfully' });
  } catch (error) {
    console.error('Error deleting permission:', error);
    res.status(500).json({ message: 'Failed to delete permission', error: error.message });
  }
});

// Get user's permissions (for frontend to check access)
router.get('/user/me', tenantAuth, async (req, res) => {
  try {
    const permissions = await Permission.getUserPermissions(req.user);
    res.json({ permissions });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    res.status(500).json({ message: 'Failed to fetch user permissions', error: error.message });
  }
});

// Bulk create default permissions for a role
router.post('/bulk/defaults', tenantAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { role, department } = req.body;
    
    if (!role) {
      return res.status(400).json({ message: 'Role is required' });
    }
    
    // Define default permissions by role
    const defaultPermissions = {
      agent: {
        clients: { view: true, create: true, edit: true, viewOwn: true },
        deals: { view: true, create: true, edit: true, viewOwn: true },
        sales: { view: true, create: true, edit: true, viewOwn: true },
        products: { view: true },
        meetings: { view: true, create: true, edit: true, viewOwn: true }
      },
      manager: {
        clients: { view: true, create: true, edit: true, viewDepartment: true },
        deals: { view: true, create: true, edit: true, viewDepartment: true },
        sales: { view: true, create: true, edit: true, viewDepartment: true },
        products: { view: true, create: true, edit: true },
        reports: { view: true, export: true },
        analytics: { view: true },
        users: { view: true, viewDepartment: true }
      },
      admin: {
        clients: { view: true, create: true, edit: true, delete: true, export: true, viewAll: true },
        deals: { view: true, create: true, edit: true, delete: true, export: true, viewAll: true },
        sales: { view: true, create: true, edit: true, delete: true, export: true, viewAll: true },
        products: { view: true, create: true, edit: true, delete: true, viewAll: true },
        reports: { view: true, export: true, viewAll: true },
        analytics: { view: true, viewAll: true },
        users: { view: true, create: true, edit: true, delete: true, viewAll: true },
        settings: { view: true, edit: true, viewAll: true }
      }
    };
    
    const rolePermissions = defaultPermissions[role];
    if (!rolePermissions) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    const created = [];
    for (const [module, actions] of Object.entries(rolePermissions)) {
      // Check if already exists
      const existing = await Permission.findOne({
        tenant: req.tenantId,
        role,
        module,
        department: department || null
      });
      
      if (!existing) {
        const permission = new Permission({
          tenant: req.tenantId,
          role,
          module,
          department: department || null,
          actions,
          createdBy: req.user._id,
          updatedBy: req.user._id
        });
        
        await permission.save();
        created.push(permission);
      }
    }
    
    res.json({
      message: `Created ${created.length} default permissions for ${role}`,
      created
    });
  } catch (error) {
    console.error('Error creating default permissions:', error);
    res.status(500).json({ message: 'Failed to create default permissions', error: error.message });
  }
});

export default router;
