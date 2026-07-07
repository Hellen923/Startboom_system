// routes/departments.js
import express from 'express';
import Department from '../models/Department.js';
import Team from '../models/Team.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permission.js';

const router = express.Router();

// Get all departments
router.get('/', auth, async (req, res) => {
  try {
    const departments = await Department.find({
      tenant: req.user.tenant,
      isActive: true
    })
      .populate('head', 'name email')
      .populate('createdBy', 'name')
      .sort({ name: 1 });
    
    // Get stats for each department
    for (let dept of departments) {
      const userCount = await User.countDocuments({
        tenant: req.user.tenant,
        department: dept._id,
        isActive: true
      });
      
      const teamCount = await Team.countDocuments({
        tenant: req.user.tenant,
        department: dept._id,
        isActive: true
      });
      
      dept.stats.totalUsers = userCount;
      dept.stats.totalTeams = teamCount;
    }
    
    res.json({
      success: true,
      count: departments.length,
      departments
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      message: 'Error fetching departments',
      error: error.message
    });
  }
});

// Get single department by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const department = await Department.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    })
      .populate('head', 'name email phone')
      .populate('createdBy', 'name');
    
    if (!department) {
      return res.status(404).json({
        message: 'Department not found'
      });
    }
    
    // Get users and teams
    const users = await User.find({
      tenant: req.user.tenant,
      department: department._id,
      isActive: true
    }).select('name email role');
    
    const teams = await Team.find({
      tenant: req.user.tenant,
      department: department._id,
      isActive: true
    }).populate('manager', 'name email');
    
    res.json({
      success: true,
      department,
      users,
      teams
    });
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({
      message: 'Error fetching department',
      error: error.message
    });
  }
});

// Create department (admin only)
router.post('/', auth, async (req, res) => {
  try {
    // Only admins can create departments
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Only administrators can create departments'
      });
    }
    
    const { name, description, modules, icon, color, head } = req.body;
    
    // Check if department name already exists for this tenant
    const existing = await Department.findOne({
      tenant: req.user.tenant,
      name: name.trim()
    });
    
    if (existing) {
      return res.status(400).json({
        message: 'A department with this name already exists'
      });
    }
    
    // Create department
    const department = new Department({
      tenant: req.user.tenant,
      name: name.trim(),
      description: description || '',
      modules: modules || ['clients', 'deals', 'sales'],
      icon: icon || 'Briefcase',
      color: color || '#0066FF',
      head: head || null,
      createdBy: req.user._id
    });
    
    await department.save();
    
    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      department
    });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({
      message: 'Error creating department',
      error: error.message
    });
  }
});

// Update department
router.put('/:id', auth, async (req, res) => {
  try {
    // Only admins can update departments
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Only administrators can update departments'
      });
    }
    
    const department = await Department.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });
    
    if (!department) {
      return res.status(404).json({
        message: 'Department not found'
      });
    }
    
    const { name, description, modules, icon, color, head, isActive } = req.body;
    
    // Check name uniqueness if changing name
    if (name && name !== department.name) {
      const existing = await Department.findOne({
        tenant: req.user.tenant,
        name: name.trim(),
        _id: { $ne: department._id }
      });
      
      if (existing) {
        return res.status(400).json({
          message: 'A department with this name already exists'
        });
      }
      department.name = name.trim();
    }
    
    if (description !== undefined) department.description = description;
    if (modules) department.modules = modules;
    if (icon) department.icon = icon;
    if (color) department.color = color;
    if (head !== undefined) department.head = head;
    if (isActive !== undefined) department.isActive = isActive;
    
    department.updatedBy = req.user._id;
    
    await department.save();
    
    res.json({
      success: true,
      message: 'Department updated successfully',
      department
    });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({
      message: 'Error updating department',
      error: error.message
    });
  }
});

// Delete (soft delete) department
router.delete('/:id', auth, async (req, res) => {
  try {
    // Only admins can delete departments
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Only administrators can delete departments'
      });
    }
    
    const department = await Department.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });
    
    if (!department) {
      return res.status(404).json({
        message: 'Department not found'
      });
    }
    
    // Check if department has users
    const userCount = await User.countDocuments({
      tenant: req.user.tenant,
      department: department._id,
      isActive: true
    });
    
    if (userCount > 0) {
      return res.status(400).json({
        message: `Cannot delete department. It has ${userCount} active user(s). Please reassign them first.`
      });
    }
    
    // Soft delete
    department.isActive = false;
    department.updatedBy = req.user._id;
    await department.save();
    
    res.json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({
      message: 'Error deleting department',
      error: error.message
    });
  }
});

// Add module to department
router.post('/:id/modules', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Only administrators can modify department modules'
      });
    }
    
    const { moduleName } = req.body;
    
    const department = await Department.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });
    
    if (!department) {
      return res.status(404).json({
        message: 'Department not found'
      });
    }
    
    await department.addModule(moduleName);
    
    res.json({
      success: true,
      message: 'Module added to department',
      modules: department.modules
    });
  } catch (error) {
    console.error('Add module error:', error);
    res.status(500).json({
      message: 'Error adding module',
      error: error.message
    });
  }
});

// Remove module from department
router.delete('/:id/modules/:moduleName', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Only administrators can modify department modules'
      });
    }
    
    const department = await Department.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });
    
    if (!department) {
      return res.status(404).json({
        message: 'Department not found'
      });
    }
    
    await department.removeModule(req.params.moduleName);
    
    res.json({
      success: true,
      message: 'Module removed from department',
      modules: department.modules
    });
  } catch (error) {
    console.error('Remove module error:', error);
    res.status(500).json({
      message: 'Error removing module',
      error: error.message
    });
  }
});

export default router;
