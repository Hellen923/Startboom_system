import express from 'express';
import Role from '../models/Role.js';
import User from '../models/User.js';
import { tenantAuth, requireRole } from '../middleware/tenantAuth.js';
import { logAction } from '../utils/auditLog.js';

const router = express.Router();

router.use(tenantAuth);
// Only admins and superadmins can manage roles
router.use(requireRole(['admin', 'superadmin']));

// Get all roles for a tenant
router.get('/', async (req, res) => {
  try {
    const roles = await Role.find({ tenant: req.tenantId }).sort({ createdAt: -1 });
    res.json({ roles });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new custom role
router.post('/', async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Role name is required' });
    }

    const existingRole = await Role.findOne({ tenant: req.tenantId, name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingRole) {
      return res.status(400).json({ message: 'A role with this name already exists' });
    }

    const role = await Role.create({
      tenant: req.tenantId,
      name,
      description,
      permissions: permissions || [],
      createdBy: req.user.userId
    });

    await logAction(req, 'CREATE', `Created custom role: ${name}`, {
      entityType: 'Role',
      entityId: role._id
    });

    res.status(201).json({ role });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a custom role
router.put('/:id', async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const role = await Role.findOne({ _id: req.params.id, tenant: req.tenantId });

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    if (role.isSystem) {
      return res.status(403).json({ message: 'System roles cannot be modified' });
    }

    if (name && name !== role.name) {
      const existingRole = await Role.findOne({ tenant: req.tenantId, name: { $regex: new RegExp(`^${name}$`, 'i') } });
      if (existingRole) {
        return res.status(400).json({ message: 'A role with this name already exists' });
      }
      role.name = name;
    }

    if (description !== undefined) role.description = description;
    if (permissions) role.permissions = permissions;

    await role.save();

    await logAction(req, 'UPDATE', `Updated custom role: ${role.name}`, {
      entityType: 'Role',
      entityId: role._id
    });

    res.json({ role });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a custom role
router.delete('/:id', async (req, res) => {
  try {
    const role = await Role.findOne({ _id: req.params.id, tenant: req.tenantId });

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    if (role.isSystem) {
      return res.status(403).json({ message: 'System roles cannot be deleted' });
    }

    // Check if any users are using this role
    const usersWithRole = await User.countDocuments({ customRole: role._id });
    if (usersWithRole > 0) {
      return res.status(400).json({ message: `Cannot delete role. It is currently assigned to ${usersWithRole} user(s).` });
    }

    await role.deleteOne();

    await logAction(req, 'DELETE', `Deleted custom role: ${role.name}`, {
      entityType: 'Role',
      entityId: role._id
    });

    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export { router as roleRoutes };
