// routes/goals.js
import express from 'express';
import Goal from '../models/Goal.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get all goals (with filters)
router.get('/', auth, async (req, res) => {
  try {
    const { type, assignmentType, status, period, userId, teamId, departmentId, branchId } = req.query;
    
    const query = {
      tenant: req.user.tenant,
      isActive: true
    };
    
    if (type) query.type = type;
    if (assignmentType) query.assignmentType = assignmentType;
    if (status) query.status = status;
    if (period) query.period = period;
    if (userId) query.user = userId;
    if (teamId) query.team = teamId;
    if (departmentId) query.department = departmentId;
    if (branchId) query.branch = branchId;
    
    // For non-admins, filter by their access level
    if (!['superadmin', 'admin'].includes(req.user.role)) {
      // Managers can see department goals
      if (req.user.role === 'manager' && req.user.department) {
        query.$or = [
          { user: req.user._id },
          { team: req.user.team },
          { department: req.user.department }
        ];
      } else {
        // Agents can only see their own goals
        query.user = req.user._id;
      }
    }
    
    const goals = await Goal.find(query)
      .populate('user', 'name email')
      .populate('team', 'name')
      .populate('department', 'name')
      .populate('branch', 'name')
      .populate('createdBy', 'name')
      .sort({ startDate: -1 });
    
    res.json({
      success: true,
      count: goals.length,
      goals
    });
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({
      message: 'Error fetching goals',
      error: error.message
    });
  }
});

// Get my goals
router.get('/my-goals', auth, async (req, res) => {
  try {
    const { period } = req.query;
    
    const goals = await Goal.getUserGoals(req.user._id, period);
    
    res.json({
      success: true,
      count: goals.length,
      goals
    });
  } catch (error) {
    console.error('Get my goals error:', error);
    res.status(500).json({
      message: 'Error fetching goals',
      error: error.message
    });
  }
});

// Get team goals
router.get('/team/:teamId', auth, async (req, res) => {
  try {
    const { period } = req.query;
    
    const goals = await Goal.getTeamGoals(req.params.teamId, period);
    
    res.json({
      success: true,
      count: goals.length,
      goals
    });
  } catch (error) {
    console.error('Get team goals error:', error);
    res.status(500).json({
      message: 'Error fetching team goals',
      error: error.message
    });
  }
});

// Get single goal by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    })
      .populate('user', 'name email')
      .populate('team', 'name')
      .populate('department', 'name')
      .populate('branch', 'name')
      .populate('parentGoal')
      .populate('childGoals')
      .populate('createdBy', 'name');
    
    if (!goal) {
      return res.status(404).json({
        message: 'Goal not found'
      });
    }
    
    // Check access
    if (!['superadmin', 'admin'].includes(req.user.role)) {
      if (req.user.role === 'manager') {
        // Managers can see department/team goals
        if (goal.department?.toString() !== req.user.department?.toString() &&
            goal.team?.toString() !== req.user.team?.toString() &&
            goal.user?.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            message: 'Access denied'
          });
        }
      } else {
        // Agents can only see their own goals
        if (goal.user?.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            message: 'Access denied'
          });
        }
      }
    }
    
    res.json({
      success: true,
      goal
    });
  } catch (error) {
    console.error('Get goal error:', error);
    res.status(500).json({
      message: 'Error fetching goal',
      error: error.message
    });
  }
});

// Create goal
router.post('/', auth, async (req, res) => {
  try {
    // Only admins and managers can create goals
    if (!['superadmin', 'admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Only administrators and managers can create goals'
      });
    }
    
    const {
      name, description, type, customMetricName,
      assignmentType, branch, department, team, user,
      period, startDate, endDate, target, unit, currency,
      milestones, parentGoal, weight, autoUpdate, notifications
    } = req.body;
    
    const goal = new Goal({
      tenant: req.user.tenant,
      name: name.trim(),
      description: description || '',
      type,
      customMetricName,
      assignmentType,
      branch, department, team, user,
      period,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      target,
      unit: unit || 'number',
      currency: currency || 'USD',
      milestones: milestones || [],
      parentGoal,
      weight: weight || 100,
      autoUpdate: autoUpdate || {},
      notifications: notifications || {},
      createdBy: req.user._id
    });
    
    await goal.save();
    
    // If this goal has a parent, add it to parent's childGoals
    if (parentGoal) {
      await Goal.updateOne(
        { _id: parentGoal },
        { $push: { childGoals: goal._id } }
      );
    }
    
    res.status(201).json({
      success: true,
      message: 'Goal created successfully',
      goal
    });
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({
      message: 'Error creating goal',
      error: error.message
    });
  }
});

// Update goal
router.put('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });
    
    if (!goal) {
      return res.status(404).json({
        message: 'Goal not found'
      });
    }
    
    // Check permissions
    if (!['superadmin', 'admin'].includes(req.user.role)) {
      if (req.user.role === 'manager') {
        // Managers can update department/team goals
        if (goal.department?.toString() !== req.user.department?.toString() &&
            goal.team?.toString() !== req.user.team?.toString()) {
          return res.status(403).json({
            message: 'Access denied'
          });
        }
      } else {
        return res.status(403).json({
          message: 'Only administrators and managers can update goals'
        });
      }
    }
    
    const {
      name, description, target, milestones,
      autoUpdate, notifications, isActive
    } = req.body;
    
    if (name) goal.name = name.trim();
    if (description !== undefined) goal.description = description;
    if (target) goal.target = target;
    if (milestones) goal.milestones = milestones;
    if (autoUpdate) goal.autoUpdate = { ...goal.autoUpdate, ...autoUpdate };
    if (notifications) goal.notifications = { ...goal.notifications, ...notifications };
    if (isActive !== undefined) goal.isActive = isActive;
    
    goal.updatedBy = req.user._id;
    
    await goal.save();
    
    res.json({
      success: true,
      message: 'Goal updated successfully',
      goal
    });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({
      message: 'Error updating goal',
      error: error.message
    });
  }
});

// Update goal progress
router.patch('/:id/progress', auth, async (req, res) => {
  try {
    const { actual, increment } = req.body;
    
    const goal = await Goal.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });
    
    if (!goal) {
      return res.status(404).json({
        message: 'Goal not found'
      });
    }
    
    if (actual !== undefined) {
      await goal.updateActual(actual);
    } else if (increment !== undefined) {
      await goal.addProgress(increment);
    } else {
      return res.status(400).json({
        message: 'Please provide either "actual" or "increment"'
      });
    }
    
    // Check milestones
    await goal.checkMilestones();
    
    res.json({
      success: true,
      message: 'Goal progress updated',
      goal
    });
  } catch (error) {
    console.error('Update goal progress error:', error);
    res.status(500).json({
      message: 'Error updating goal progress',
      error: error.message
    });
  }
});

// Cascade goal (split parent goal to children)
router.post('/:id/cascade', auth, async (req, res) => {
  try {
    if (!['superadmin', 'admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Only administrators and managers can cascade goals'
      });
    }
    
    const { childAssignments } = req.body;
    // childAssignments: [{ assignmentType, assignmentId, target, weight, name }]
    
    const childGoals = await Goal.cascadeGoal(req.params.id, childAssignments);
    
    res.status(201).json({
      success: true,
      message: 'Goal cascaded successfully',
      childGoals
    });
  } catch (error) {
    console.error('Cascade goal error:', error);
    res.status(500).json({
      message: 'Error cascading goal',
      error: error.message
    });
  }
});

// Get goal hierarchy
router.get('/:id/hierarchy', auth, async (req, res) => {
  try {
    const hierarchy = await Goal.getGoalHierarchy(req.params.id);
    
    if (!hierarchy) {
      return res.status(404).json({
        message: 'Goal not found'
      });
    }
    
    res.json({
      success: true,
      hierarchy
    });
  } catch (error) {
    console.error('Get goal hierarchy error:', error);
    res.status(500).json({
      message: 'Error fetching goal hierarchy',
      error: error.message
    });
  }
});

// Delete (soft delete) goal
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!['superadmin', 'admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Only administrators and managers can delete goals'
      });
    }
    
    const goal = await Goal.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });
    
    if (!goal) {
      return res.status(404).json({
        message: 'Goal not found'
      });
    }
    
    goal.isActive = false;
    goal.updatedBy = req.user._id;
    await goal.save();
    
    res.json({
      success: true,
      message: 'Goal deleted successfully'
    });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({
      message: 'Error deleting goal',
      error: error.message
    });
  }
});

export default router;
