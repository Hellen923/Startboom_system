// routes/activities.js
import express from 'express';
import Activity from '../models/Activity.js';
import { tenantAuth, requireTenantModule } from '../middleware/tenantAuth.js';

const router = express.Router();

// Apply tenant authentication
router.use(tenantAuth);


// Get all activities (with filters)
router.get('/', async (req, res) => {
  try {
    const { 
      type, entityType, entityId, userId, teamId, departmentId, branchId,
      outcome, isHighValue, startDate, endDate, limit = 50, skip = 0 
    } = req.query;
    
    const query = {
      ...req.tenantQuery,
      isActive: true
    };
    
    if (type) query.type = type;
    if (entityType) query.entityType = entityType;
    if (entityId) query.entityId = entityId;
    if (userId) query.user = userId;
    if (teamId) query.team = teamId;
    if (departmentId) query.department = departmentId;
    if (branchId) query.branch = branchId;
    if (outcome) query.outcome = outcome;
    if (isHighValue) query.isHighValue = isHighValue === 'true';
    
    // Date range filter
    if (startDate || endDate) {
      query.completedAt = {};
      if (startDate) query.completedAt.$gte = new Date(startDate);
      if (endDate) query.completedAt.$lte = new Date(endDate);
    }
    
    // For non-admins, filter by their access level
    if (!(req.isSuperAdmin || req.user.role === 'admin')) {
      if (req.user.role === 'manager' && req.user.department) {
        query.$or = [
          { user: req.user.userId },
          { team: req.user.team },
          { department: req.user.department }
        ];
      } else {
        // Agents can only see their own activities
        query.user = req.user.userId;
      }
    }
    
    const activities = await Activity.find(query)
      .populate('user', 'name email')
      .populate('entityId')
      .populate('owner', 'name email')
      .sort({ completedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));
    
    const total = await Activity.countDocuments(query);
    
    res.json({
      success: true,
      count: activities.length,
      total,
      activities
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      message: 'Error fetching activities',
      error: error.message
    });
  }
});

// Get my activities
router.get('/my-activities', async (req, res) => {
  try {
    const { startDate, endDate, type, limit = 50 } = req.query;
    
    const query = {
      ...req.tenantQuery,
      user: req.user.userId,
      isActive: true
    };
    
    if (type) query.type = type;
    
    if (startDate || endDate) {
      query.completedAt = {};
      if (startDate) query.completedAt.$gte = new Date(startDate);
      if (endDate) query.completedAt.$lte = new Date(endDate);
    }
    
    const activities = await Activity.find(query)
      .populate('entityId')
      .sort({ completedAt: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      count: activities.length,
      activities
    });
  } catch (error) {
    console.error('Get my activities error:', error);
    res.status(500).json({
      message: 'Error fetching activities',
      error: error.message
    });
  }
});

// Get activity stats for user
router.get('/stats/user/:userId', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Check access
    if (!['superadmin', 'admin', 'manager'].includes(req.user.role) && 
        req.params.userId !== req.user.userId.toString()) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }
    
    const stats = await Activity.getUserStats(
      req.params.userId,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      message: 'Error fetching user stats',
      error: error.message
    });
  }
});

// Get my activity stats
router.get('/stats/my-stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const stats = await Activity.getUserStats(
      req.user.userId,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get my stats error:', error);
    res.status(500).json({
      message: 'Error fetching stats',
      error: error.message
    });
  }
});

// Get activity breakdown by type
router.get('/stats/breakdown/:userId', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Check access
    if (!['superadmin', 'admin', 'manager'].includes(req.user.role) && 
        req.params.userId !== req.user.userId.toString()) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }
    
    const breakdown = await Activity.getActivityBreakdown(
      req.params.userId,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );
    
    res.json({
      success: true,
      breakdown
    });
  } catch (error) {
    console.error('Get activity breakdown error:', error);
    res.status(500).json({
      message: 'Error fetching activity breakdown',
      error: error.message
    });
  }
});

// Get team activity stats
router.get('/stats/team/:teamId', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Check access
    if (!['superadmin', 'admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Only administrators and managers can view team stats'
      });
    }
    
    const stats = await Activity.getTeamStats(
      req.params.teamId,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get team stats error:', error);
    res.status(500).json({
      message: 'Error fetching team stats',
      error: error.message
    });
  }
});

// Get battle card (leaderboard of activity scores)
router.get('/stats/battle-card', async (req, res) => {
  try {
    const { startDate, endDate, teamId, departmentId, branchId } = req.query;
    
    const match = {
      ...req.tenantQuery,
      isActive: true
    };
    
    // Date range
    if (startDate || endDate) {
      match.completedAt = {};
      if (startDate) match.completedAt.$gte = new Date(startDate);
      if (endDate) match.completedAt.$lte = new Date(endDate);
    }
    
    // Filters
    if (teamId) match.team = teamId;
    if (departmentId) match.department = departmentId;
    if (branchId) match.branch = branchId;
    
    // Access control
    if (!(req.isSuperAdmin || req.user.role === 'admin')) {
      if (req.user.role === 'manager' && req.user.department) {
        match.department = req.user.department;
      } else {
        match.team = req.user.team;
      }
    }
    
    const leaderboard = await Activity.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$user',
          totalActivities: { $sum: 1 },
          totalScore: { $sum: '$score' },
          highValueActivities: { $sum: { $cond: ['$isHighValue', 1, 0] } },
          totalDuration: { $sum: '$duration' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          userName: '$user.name',
          userEmail: '$user.email',
          userRole: '$user.role',
          totalActivities: 1,
          totalScore: 1,
          highValueActivities: 1,
          totalDuration: 1
        }
      },
      { $sort: { totalScore: -1 } },
      { $limit: 20 }
    ]);
    
    res.json({
      success: true,
      leaderboard
    });
  } catch (error) {
    console.error('Get battle card error:', error);
    res.status(500).json({
      message: 'Error fetching battle card',
      error: error.message
    });
  }
});

// Get activity scores configuration
router.get('/scores', async (req, res) => {
  try {
    const scores = Activity.getActivityScores();
    
    res.json({
      success: true,
      scores
    });
  } catch (error) {
    console.error('Get activity scores error:', error);
    res.status(500).json({
      message: 'Error fetching activity scores',
      error: error.message
    });
  }
});

// Get single activity by ID
router.get('/:id', async (req, res) => {
  try {
    const activity = await Activity.findOne({
      _id: req.params.id,
      ...req.tenantQuery
    })
      .populate('user', 'name email')
      .populate('entityId')
      .populate('owner', 'name email')
      .populate('department', 'name')
      .populate('team', 'name')
      .populate('branch', 'name');
    
    if (!activity) {
      return res.status(404).json({
        message: 'Activity not found'
      });
    }
    
    // Check access
    if (!(req.isSuperAdmin || req.user.role === 'admin')) {
      if (req.user.role === 'manager') {
        if (activity.department?.toString() !== req.user.department?.toString() &&
            activity.team?.toString() !== req.user.team?.toString() &&
            activity.user?._id?.toString() !== req.user.userId.toString()) {
          return res.status(403).json({
            message: 'Access denied'
          });
        }
      } else {
        if (activity.user?._id?.toString() !== req.user.userId.toString()) {
          return res.status(403).json({
            message: 'Access denied'
          });
        }
      }
    }
    
    res.json({
      success: true,
      activity
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({
      message: 'Error fetching activity',
      error: error.message
    });
  }
});

// Create activity
router.post('/', async (req, res) => {
  try {
    const {
      type, customTypeName, entityType, entityId,
      title, description, duration, outcome,
      scheduledAt, completedAt, location, participants,
      nextSteps, followUpRequired, followUpDate,
      attachments, tags, metadata
    } = req.body;
    
    const activity = new Activity({
      ...req.tenantQuery,
      user: req.user.userId,
      type,
      customTypeName,
      entityType: entityType || 'none',
      entityId,
      title: title.trim(),
      description: description || '',
      duration: duration || 0,
      outcome: outcome || 'none',
      scheduledAt,
      completedAt: completedAt || new Date(),
      location: location || '',
      participants: participants || [],
      nextSteps: nextSteps || '',
      followUpRequired: followUpRequired || false,
      followUpDate,
      attachments: attachments || [],
      tags: tags || [],
      metadata: metadata || {},
      owner: req.user.userId,
      department: req.user.department,
      team: req.user.team,
      branch: req.user.branch
    });
    
    await activity.save();
    
    res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      activity
    });
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({
      message: 'Error creating activity',
      error: error.message
    });
  }
});

// Update activity
router.put('/:id', async (req, res) => {
  try {
    const activity = await Activity.findOne({
      _id: req.params.id,
      ...req.tenantQuery
    });
    
    if (!activity) {
      return res.status(404).json({
        message: 'Activity not found'
      });
    }
    
    // Check permissions (only owner or admin can update)
    if (!(req.isSuperAdmin || req.user.role === 'admin') &&
        activity.user.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }
    
    const {
      title, description, duration, outcome,
      completedAt, location, participants,
      nextSteps, followUpRequired, followUpDate,
      attachments, tags, metadata, isActive
    } = req.body;
    
    if (title) activity.title = title.trim();
    if (description !== undefined) activity.description = description;
    if (duration !== undefined) activity.duration = duration;
    if (outcome) activity.outcome = outcome;
    if (completedAt) activity.completedAt = new Date(completedAt);
    if (location !== undefined) activity.location = location;
    if (participants) activity.participants = participants;
    if (nextSteps !== undefined) activity.nextSteps = nextSteps;
    if (followUpRequired !== undefined) activity.followUpRequired = followUpRequired;
    if (followUpDate) activity.followUpDate = followUpDate;
    if (attachments) activity.attachments = attachments;
    if (tags) activity.tags = tags;
    if (metadata) activity.metadata = { ...activity.metadata, ...metadata };
    if (isActive !== undefined) activity.isActive = isActive;
    
    await activity.save();
    
    res.json({
      success: true,
      message: 'Activity updated successfully',
      activity
    });
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({
      message: 'Error updating activity',
      error: error.message
    });
  }
});

// Delete (soft delete) activity
router.delete('/:id', async (req, res) => {
  try {
    const activity = await Activity.findOne({
      _id: req.params.id,
      ...req.tenantQuery
    });
    
    if (!activity) {
      return res.status(404).json({
        message: 'Activity not found'
      });
    }
    
    // Check permissions (only owner or admin can delete)
    if (!(req.isSuperAdmin || req.user.role === 'admin') &&
        activity.user.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }
    
    activity.isActive = false;
    await activity.save();
    
    res.json({
      success: true,
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({
      message: 'Error deleting activity',
      error: error.message
    });
  }
});

export default router;
