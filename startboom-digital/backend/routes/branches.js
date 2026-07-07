// routes/branches.js
import express from 'express';
import Branch from '../models/Branch.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get all branches
router.get('/', auth, async (req, res) => {
  try {
    const { type, isActive, parentBranch } = req.query;
    
    const query = {
      tenant: req.user.tenant
    };
    
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (parentBranch) query.parentBranch = parentBranch === 'null' ? null : parentBranch;
    
    const branches = await Branch.find(query)
      .populate('manager', 'name email')
      .populate('parentBranch', 'name code')
      .populate('createdBy', 'name')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      count: branches.length,
      branches
    });
  } catch (error) {
    console.error('Get branches error:', error);
    res.status(500).json({
      message: 'Error fetching branches',
      error: error.message
    });
  }
});

// Get branch tree (hierarchical structure)
router.get('/tree', auth, async (req, res) => {
  try {
    const tree = await Branch.getBranchTree(req.user.tenant);
    
    res.json({
      success: true,
      tree
    });
  } catch (error) {
    console.error('Get branch tree error:', error);
    res.status(500).json({
      message: 'Error fetching branch tree',
      error: error.message
    });
  }
});

// Get single branch by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const branch = await Branch.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    })
      .populate('manager', 'name email phone')
      .populate('parentBranch', 'name code')
      .populate('createdBy', 'name');
    
    if (!branch) {
      return res.status(404).json({
        message: 'Branch not found'
      });
    }
    
    // Get child branches
    const children = await branch.getChildBranches();
    
    res.json({
      success: true,
      branch: {
        ...branch.toObject(),
        fullAddress: branch.fullAddress,
        children
      }
    });
  } catch (error) {
    console.error('Get branch error:', error);
    res.status(500).json({
      message: 'Error fetching branch',
      error: error.message
    });
  }
});

// Get branch hierarchy path
router.get('/:id/hierarchy', auth, async (req, res) => {
  try {
    const branch = await Branch.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });
    
    if (!branch) {
      return res.status(404).json({
        message: 'Branch not found'
      });
    }
    
    const hierarchyPath = await branch.getHierarchyPath();
    
    res.json({
      success: true,
      path: hierarchyPath
    });
  } catch (error) {
    console.error('Get branch hierarchy error:', error);
    res.status(500).json({
      message: 'Error fetching branch hierarchy',
      error: error.message
    });
  }
});

// Create branch
router.post('/', auth, async (req, res) => {
  try {
    // Only admins can create branches
    if (!['superadmin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Only administrators can create branches'
      });
    }
    
    const {
      name, code, description, type, address, coordinates,
      contact, manager, parentBranch, timezone, currency,
      operatingHours, settings
    } = req.body;
    
    // Check if name already exists
    const existing = await Branch.findOne({
      tenant: req.user.tenant,
      name: name.trim()
    });
    
    if (existing) {
      return res.status(400).json({
        message: 'A branch with this name already exists'
      });
    }
    
    const branch = new Branch({
      tenant: req.user.tenant,
      name: name.trim(),
      code: code ? code.toUpperCase().trim() : undefined,
      description: description || '',
      type: type || 'branch',
      address: address || {},
      coordinates: coordinates || {},
      contact: contact || {},
      manager,
      parentBranch: parentBranch || null,
      timezone: timezone || 'Africa/Kampala',
      currency: currency || 'UGX',
      operatingHours: operatingHours || {},
      settings: settings || {},
      createdBy: req.user._id
    });
    
    await branch.save();
    
    res.status(201).json({
      success: true,
      message: 'Branch created successfully',
      branch
    });
  } catch (error) {
    console.error('Create branch error:', error);
    res.status(500).json({
      message: 'Error creating branch',
      error: error.message
    });
  }
});

// Update branch
router.put('/:id', auth, async (req, res) => {
  try {
    if (!['superadmin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Only administrators can update branches'
      });
    }
    
    const branch = await Branch.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });
    
    if (!branch) {
      return res.status(404).json({
        message: 'Branch not found'
      });
    }
    
    const {
      name, code, description, type, address, coordinates,
      contact, manager, parentBranch, timezone, currency,
      operatingHours, settings, isActive
    } = req.body;
    
    // Check name uniqueness if changing
    if (name && name !== branch.name) {
      const existing = await Branch.findOne({
        tenant: req.user.tenant,
        name: name.trim(),
        _id: { $ne: branch._id }
      });
      
      if (existing) {
        return res.status(400).json({
          message: 'A branch with this name already exists'
        });
      }
      branch.name = name.trim();
    }
    
    if (code !== undefined) branch.code = code ? code.toUpperCase().trim() : '';
    if (description !== undefined) branch.description = description;
    if (type) branch.type = type;
    if (address) branch.address = { ...branch.address, ...address };
    if (coordinates) branch.coordinates = { ...branch.coordinates, ...coordinates };
    if (contact) branch.contact = { ...branch.contact, ...contact };
    if (manager !== undefined) branch.manager = manager;
    if (parentBranch !== undefined) branch.parentBranch = parentBranch;
    if (timezone) branch.timezone = timezone;
    if (currency) branch.currency = currency;
    if (operatingHours) branch.operatingHours = { ...branch.operatingHours, ...operatingHours };
    if (settings) branch.settings = new Map({ ...Object.fromEntries(branch.settings), ...settings });
    if (isActive !== undefined) branch.isActive = isActive;
    
    branch.updatedBy = req.user._id;
    
    await branch.save();
    
    res.json({
      success: true,
      message: 'Branch updated successfully',
      branch
    });
  } catch (error) {
    console.error('Update branch error:', error);
    res.status(500).json({
      message: 'Error updating branch',
      error: error.message
    });
  }
});

// Update branch stats
router.patch('/:id/stats', auth, async (req, res) => {
  try {
    if (!['superadmin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Only administrators can update branch stats'
      });
    }
    
    const { totalUsers, totalClients, totalRevenue } = req.body;
    
    const branch = await Branch.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });
    
    if (!branch) {
      return res.status(404).json({
        message: 'Branch not found'
      });
    }
    
    if (totalUsers !== undefined) branch.stats.totalUsers = totalUsers;
    if (totalClients !== undefined) branch.stats.totalClients = totalClients;
    if (totalRevenue !== undefined) branch.stats.totalRevenue = totalRevenue;
    branch.stats.lastUpdated = new Date();
    
    await branch.save();
    
    res.json({
      success: true,
      message: 'Branch stats updated',
      stats: branch.stats
    });
  } catch (error) {
    console.error('Update branch stats error:', error);
    res.status(500).json({
      message: 'Error updating branch stats',
      error: error.message
    });
  }
});

// Delete (soft delete) branch
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!['superadmin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Only administrators can delete branches'
      });
    }
    
    const branch = await Branch.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });
    
    if (!branch) {
      return res.status(404).json({
        message: 'Branch not found'
      });
    }
    
    // Check if branch has child branches
    const children = await branch.getChildBranches();
    if (children.length > 0) {
      return res.status(400).json({
        message: 'Cannot delete branch with child branches. Please reassign or delete child branches first.'
      });
    }
    
    branch.isActive = false;
    branch.updatedBy = req.user._id;
    await branch.save();
    
    res.json({
      success: true,
      message: 'Branch deleted successfully'
    });
  } catch (error) {
    console.error('Delete branch error:', error);
    res.status(500).json({
      message: 'Error deleting branch',
      error: error.message
    });
  }
});

export default router;
