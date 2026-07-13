// routes/teams.js
import express from 'express';
import Team from '../models/Team.js';
import Department from '../models/Department.js';
import User from '../models/User.js';
import { tenantAuth, requireTenantModule } from '../middleware/tenantAuth.js';

const router = express.Router();

// Apply tenant authentication and module enforcement
router.use(tenantAuth);
router.use(requireTenantModule('teams'));


// Get all teams (optionally filter by department)
router.get('/', async (req, res) => {
  try {
    const { department } = req.query;
    
    const query = {
      ...req.tenantQuery,
      isActive: true
    };
    
    if (department) {
      query.department = department;
    }
    
    const teams = await Team.find(query)
      .populate('department', 'name')
      .populate('manager', 'name email')
      .populate('members.user', 'name email role')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      count: teams.length,
      teams
    });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({
      message: 'Error fetching teams',
      error: error.message
    });
  }
});

// Get single team by ID
router.get('/:id', async (req, res) => {
  try {
    const team = await Team.findOne({
      _id: req.params.id,
      ...req.tenantQuery
    })
      .populate('department', 'name modules')
      .populate('manager', 'name email phone')
      .populate('members.user', 'name email role phone')
      .populate('createdBy', 'name');
    
    if (!team) {
      return res.status(404).json({
        message: 'Team not found'
      });
    }
    
    res.json({
      success: true,
      team
    });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({
      message: 'Error fetching team',
      error: error.message
    });
  }
});

// Create team
router.post('/', async (req, res) => {
  try {
    // Only admins and managers can create teams
    if (!['superadmin', 'admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Only administrators and managers can create teams'
      });
    }
    
    const { name, description, department, manager, members, targets } = req.body;
    
    // Validate department exists
    const dept = await Department.findOne({
      _id: department,
      ...req.tenantQuery,
      isActive: true
    });
    
    if (!dept) {
      return res.status(400).json({
        message: 'Department not found or inactive'
      });
    }
    
    // Check if team name already exists for this tenant
    const existing = await Team.findOne({
      ...req.tenantQuery,
      name: name.trim()
    });
    
    if (existing) {
      return res.status(400).json({
        message: 'A team with this name already exists'
      });
    }
    
    // Create team
    const team = new Team({
      ...req.tenantQuery,
      department: department,
      name: name.trim(),
      description: description || '',
      manager: manager || null,
      members: members || [],
      targets: targets || {},
      createdBy: req.user.userId
    });
    
    await team.save();
    
    // Update users' team field
    if (members && members.length > 0) {
      const memberUserIds = members.map(m => m.user);
      await User.updateMany(
        { _id: { $in: memberUserIds } },
        { $set: { team: team._id } }
      );
    }
    
    // Populate before returning
    await team.populate([
      { path: 'department', select: 'name' },
      { path: 'manager', select: 'name email' },
      { path: 'members.user', select: 'name email role' }
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      team
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({
      message: 'Error creating team',
      error: error.message
    });
  }
});

// Update team
router.put('/:id', async (req, res) => {
  try {
    // Only admins and managers can update teams
    if (!['superadmin', 'admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Only administrators and managers can update teams'
      });
    }
    
    const team = await Team.findOne({
      _id: req.params.id,
      ...req.tenantQuery
    });
    
    if (!team) {
      return res.status(404).json({
        message: 'Team not found'
      });
    }
    
    const { name, description, manager, targets, isActive } = req.body;
    
    // Check name uniqueness if changing name
    if (name && name !== team.name) {
      const existing = await Team.findOne({
        ...req.tenantQuery,
        name: name.trim(),
        _id: { $ne: team._id }
      });
      
      if (existing) {
        return res.status(400).json({
          message: 'A team with this name already exists'
        });
      }
      team.name = name.trim();
    }
    
    if (description !== undefined) team.description = description;
    if (manager !== undefined) team.manager = manager;
    if (targets) team.targets = { ...team.targets, ...targets };
    if (isActive !== undefined) team.isActive = isActive;
    
    team.updatedBy = req.user.userId;
    
    await team.save();
    await team.populate([
      { path: 'department', select: 'name' },
      { path: 'manager', select: 'name email' },
      { path: 'members.user', select: 'name email role' }
    ]);
    
    res.json({
      success: true,
      message: 'Team updated successfully',
      team
    });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({
      message: 'Error updating team',
      error: error.message
    });
  }
});

// Add member to team
router.post('/:id/members', async (req, res) => {
  try {
    if (!['superadmin', 'admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Only administrators and managers can add team members'
      });
    }
    
    const { userId, role } = req.body;
    
    const team = await Team.findOne({
      _id: req.params.id,
      ...req.tenantQuery
    });
    
    if (!team) {
      return res.status(404).json({
        message: 'Team not found'
      });
    }
    
    // Check if user exists and belongs to same tenant
    const user = await User.findOne({
      _id: userId,
      ...req.tenantQuery,
      isActive: true
    });
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }
    
    // Add member to team
    await team.addMember(userId, role || 'member');
    
    // Update user's team field
    user.team = team._id;
    await user.save();
    
    await team.populate('members.user', 'name email role');
    
    res.json({
      success: true,
      message: 'Member added to team',
      members: team.members
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({
      message: 'Error adding member',
      error: error.message
    });
  }
});

// Remove member from team
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    if (!['superadmin', 'admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Only administrators and managers can remove team members'
      });
    }
    
    const team = await Team.findOne({
      _id: req.params.id,
      ...req.tenantQuery
    });
    
    if (!team) {
      return res.status(404).json({
        message: 'Team not found'
      });
    }
    
    await team.removeMember(req.params.userId);
    
    // Clear user's team field
    await User.updateOne(
      { _id: req.params.userId },
      { $set: { team: null } }
    );
    
    await team.populate('members.user', 'name email role');
    
    res.json({
      success: true,
      message: 'Member removed from team',
      members: team.getActiveMembers()
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      message: 'Error removing member',
      error: error.message
    });
  }
});

// Delete (soft delete) team
router.delete('/:id', async (req, res) => {
  try {
    if (!['superadmin', 'admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Only administrators and managers can delete teams'
      });
    }
    
    const team = await Team.findOne({
      _id: req.params.id,
      ...req.tenantQuery
    });
    
    if (!team) {
      return res.status(404).json({
        message: 'Team not found'
      });
    }
    
    // Soft delete
    team.isActive = false;
    team.updatedBy = req.user.userId;
    await team.save();
    
    // Clear team field from all members
    const memberUserIds = team.members.map(m => m.user);
    await User.updateMany(
      { _id: { $in: memberUserIds } },
      { $set: { team: null } }
    );
    
    res.json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({
      message: 'Error deleting team',
      error: error.message
    });
  }
});

// Get user's teams
router.get('/user/my-teams', async (req, res) => {
  try {
    const teams = await Team.getUserTeams(req.user.tenantId, req.user.userId);
    
    res.json({
      success: true,
      count: teams.length,
      teams
    });
  } catch (error) {
    console.error('Get user teams error:', error);
    res.status(500).json({
      message: 'Error fetching user teams',
      error: error.message
    });
  }
});

export default router;
