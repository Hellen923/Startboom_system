// routes/forecasts.js
import express from 'express';
import Forecast from '../models/Forecast.js';
import Deal from '../models/Deal.js';
import { tenantAuth, requireTenantModule } from '../middleware/tenantAuth.js';

const router = express.Router();

// Apply tenant authentication and module enforcement
router.use(tenantAuth);
router.use(requireTenantModule('forecasts'));


// Get all forecasts (with filters)
router.get('/', async (req, res) => {
  try {
    const { 
      period, status, assignmentType, userId, teamId, 
      departmentId, branchId, startDate, endDate 
    } = req.query;
    
    const query = {
      ...req.tenantQuery
    };
    
    if (period) query.period = period;
    if (status) query.status = status;
    if (assignmentType) query.assignmentType = assignmentType;
    if (userId) query.user = userId;
    if (teamId) query.team = teamId;
    if (departmentId) query.department = departmentId;
    if (branchId) query.branch = branchId;
    
    // Date range filter
    if (startDate) {
      query.startDate = { $gte: new Date(startDate) };
    }
    if (endDate) {
      query.endDate = { $lte: new Date(endDate) };
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
        // Agents can only see their own forecasts
        query.user = req.user.userId;
      }
    }
    
    const forecasts = await Forecast.find(query)
      .populate('user', 'name email')
      .populate('team', 'name')
      .populate('department', 'name')
      .populate('branch', 'name')
      .populate('createdBy', 'name')
      .sort({ startDate: -1 });
    
    res.json({
      success: true,
      count: forecasts.length,
      forecasts
    });
  } catch (error) {
    console.error('Get forecasts error:', error);
    res.status(500).json({
      message: 'Error fetching forecasts',
      error: error.message
    });
  }
});

// Get my forecasts
router.get('/my-forecasts', async (req, res) => {
  try {
    const { period, status } = req.query;
    
    const query = {
      ...req.tenantQuery,
      user: req.user.userId
    };
    
    if (period) query.period = period;
    if (status) query.status = status;
    
    const forecasts = await Forecast.find(query)
      .sort({ startDate: -1 });
    
    res.json({
      success: true,
      count: forecasts.length,
      forecasts
    });
  } catch (error) {
    console.error('Get my forecasts error:', error);
    res.status(500).json({
      message: 'Error fetching forecasts',
      error: error.message
    });
  }
});

// Get single forecast by ID
router.get('/:id', async (req, res) => {
  try {
    const forecast = await Forecast.findOne({
      _id: req.params.id,
      ...req.tenantQuery
    })
      .populate('user', 'name email')
      .populate('team', 'name')
      .populate('department', 'name')
      .populate('branch', 'name')
      .populate('topDeals.dealId', 'title value stage')
      .populate('createdBy', 'name');
    
    if (!forecast) {
      return res.status(404).json({
        message: 'Forecast not found'
      });
    }
    
    // Check access
    if (!(req.isSuperAdmin || req.user.role === 'admin')) {
      if (req.user.role === 'manager') {
        if (forecast.department?.toString() !== req.user.department?.toString() &&
            forecast.team?.toString() !== req.user.team?.toString() &&
            forecast.user?.toString() !== req.user.userId.toString()) {
          return res.status(403).json({
            message: 'Access denied'
          });
        }
      } else {
        if (forecast.user?.toString() !== req.user.userId.toString()) {
          return res.status(403).json({
            message: 'Access denied'
          });
        }
      }
    }
    
    res.json({
      success: true,
      forecast
    });
  } catch (error) {
    console.error('Get forecast error:', error);
    res.status(500).json({
      message: 'Error fetching forecast',
      error: error.message
    });
  }
});

// Create forecast
router.post('/', async (req, res) => {
  try {
    if (!['superadmin', 'admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Only administrators and managers can create forecasts'
      });
    }
    
    const {
      name, period, startDate, endDate, metric, customMetricName,
      commit, bestCase, worstCase, pipeline, target,
      assignmentType, branch, department, team, user,
      stageBreakdown, topDeals, notes, autoUpdate
    } = req.body;
    
    const forecast = new Forecast({
      ...req.tenantQuery,
      name: name.trim(),
      period,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      metric: metric || 'revenue',
      customMetricName,
      commit: commit || 0,
      bestCase: bestCase || 0,
      worstCase: worstCase || 0,
      pipeline: pipeline || 0,
      target: target || 0,
      assignmentType,
      branch, department, team, user,
      stageBreakdown: stageBreakdown || [],
      topDeals: topDeals || [],
      notes: notes || '',
      autoUpdate: autoUpdate || { enabled: true },
      createdBy: req.user.userId
    });
    
    // Generate insights
    forecast.generateInsights();
    
    await forecast.save();
    
    res.status(201).json({
      success: true,
      message: 'Forecast created successfully',
      forecast
    });
  } catch (error) {
    console.error('Create forecast error:', error);
    res.status(500).json({
      message: 'Error creating forecast',
      error: error.message
    });
  }
});

// Calculate forecast from pipeline
router.post('/calculate', async (req, res) => {
  try {
    if (!['superadmin', 'admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Only administrators and managers can calculate forecasts'
      });
    }
    
    const { userId, teamId, departmentId, branchId, startDate, endDate, target } = req.body;
    
    // Build query for deals
    const dealQuery = {
      ...req.tenantQuery,
      status: 'open' // Only open deals count toward forecast
    };
    
    if (userId) dealQuery.owner = userId;
    if (teamId) dealQuery.team = teamId;
    if (departmentId) dealQuery.department = departmentId;
    if (branchId) dealQuery.branch = branchId;
    
    if (startDate && endDate) {
      dealQuery.expectedCloseDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Fetch deals
    const deals = await Deal.find(dealQuery)
      .populate('currentStage');
    
    // Calculate forecast
    const forecastData = await Forecast.calculateFromPipeline(deals, target || 0);
    
    res.json({
      success: true,
      message: 'Forecast calculated successfully',
      forecast: forecastData,
      dealCount: deals.length
    });
  } catch (error) {
    console.error('Calculate forecast error:', error);
    res.status(500).json({
      message: 'Error calculating forecast',
      error: error.message
    });
  }
});

// Update forecast
router.put('/:id', async (req, res) => {
  try {
    const forecast = await Forecast.findOne({
      _id: req.params.id,
      ...req.tenantQuery
    });
    
    if (!forecast) {
      return res.status(404).json({
        message: 'Forecast not found'
      });
    }
    
    // Check permissions
    if (!(req.isSuperAdmin || req.user.role === 'admin')) {
      if (req.user.role === 'manager') {
        if (forecast.department?.toString() !== req.user.department?.toString() &&
            forecast.team?.toString() !== req.user.team?.toString()) {
          return res.status(403).json({
            message: 'Access denied'
          });
        }
      } else {
        return res.status(403).json({
          message: 'Only administrators and managers can update forecasts'
        });
      }
    }
    
    const {
      name, commit, bestCase, worstCase, pipeline, target, actual,
      stageBreakdown, topDeals, notes, status, autoUpdate
    } = req.body;
    
    if (name) forecast.name = name.trim();
    if (commit !== undefined) forecast.commit = commit;
    if (bestCase !== undefined) forecast.bestCase = bestCase;
    if (worstCase !== undefined) forecast.worstCase = worstCase;
    if (pipeline !== undefined) forecast.pipeline = pipeline;
    if (target !== undefined) forecast.target = target;
    if (actual !== undefined) forecast.actual = actual;
    if (stageBreakdown) forecast.stageBreakdown = stageBreakdown;
    if (topDeals) forecast.topDeals = topDeals;
    if (notes !== undefined) forecast.notes = notes;
    if (status) forecast.status = status;
    if (autoUpdate) forecast.autoUpdate = { ...forecast.autoUpdate, ...autoUpdate };
    
    forecast.updatedBy = req.user.userId;
    
    // Regenerate insights
    forecast.generateInsights();
    
    await forecast.save();
    
    res.json({
      success: true,
      message: 'Forecast updated successfully',
      forecast
    });
  } catch (error) {
    console.error('Update forecast error:', error);
    res.status(500).json({
      message: 'Error updating forecast',
      error: error.message
    });
  }
});

// Update actual results (as deals close)
router.patch('/:id/actual', async (req, res) => {
  try {
    const { actual } = req.body;
    
    if (actual === undefined) {
      return res.status(400).json({
        message: 'Please provide actual value'
      });
    }
    
    const forecast = await Forecast.findOne({
      _id: req.params.id,
      ...req.tenantQuery
    });
    
    if (!forecast) {
      return res.status(404).json({
        message: 'Forecast not found'
      });
    }
    
    forecast.actual = actual;
    forecast.updatedBy = req.user.userId;
    
    // Regenerate insights with accuracy data
    forecast.generateInsights();
    
    await forecast.save();
    
    res.json({
      success: true,
      message: 'Actual results updated',
      forecast
    });
  } catch (error) {
    console.error('Update actual results error:', error);
    res.status(500).json({
      message: 'Error updating actual results',
      error: error.message
    });
  }
});

// Generate insights for forecast
router.post('/:id/insights', async (req, res) => {
  try {
    const forecast = await Forecast.findOne({
      _id: req.params.id,
      ...req.tenantQuery
    });
    
    if (!forecast) {
      return res.status(404).json({
        message: 'Forecast not found'
      });
    }
    
    const insights = forecast.generateInsights();
    await forecast.save();
    
    res.json({
      success: true,
      insights
    });
  } catch (error) {
    console.error('Generate insights error:', error);
    res.status(500).json({
      message: 'Error generating insights',
      error: error.message
    });
  }
});

// Delete (archive) forecast
router.delete('/:id', async (req, res) => {
  try {
    if (!['superadmin', 'admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Only administrators and managers can delete forecasts'
      });
    }
    
    const forecast = await Forecast.findOne({
      _id: req.params.id,
      ...req.tenantQuery
    });
    
    if (!forecast) {
      return res.status(404).json({
        message: 'Forecast not found'
      });
    }
    
    forecast.status = 'archived';
    forecast.updatedBy = req.user.userId;
    await forecast.save();
    
    res.json({
      success: true,
      message: 'Forecast archived successfully'
    });
  } catch (error) {
    console.error('Delete forecast error:', error);
    res.status(500).json({
      message: 'Error deleting forecast',
      error: error.message
    });
  }
});

export default router;
