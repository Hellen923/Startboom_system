// routes/intelligence.js
// Proactive intelligence and alerts API
import express from 'express';
import { auth } from '../middleware/auth.js';
import intelligenceService from '../services/intelligenceService.js';

const router = express.Router();

// Get comprehensive intelligence dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    const filters = {};
    
    // Apply role-based filtering
    if (!['superadmin', 'admin'].includes(req.user.role)) {
      if (req.user.role === 'manager') {
        filters.departmentId = req.user.department;
      } else {
        filters.userId = req.user._id;
      }
    }
    
    // Allow query overrides for admins
    if (['superadmin', 'admin'].includes(req.user.role)) {
      if (req.query.userId) filters.userId = req.query.userId;
      if (req.query.teamId) filters.teamId = req.query.teamId;
      if (req.query.departmentId) filters.departmentId = req.query.departmentId;
      if (req.query.branchId) filters.branchId = req.query.branchId;
    }
    
    const dashboard = await intelligenceService.getIntelligenceDashboard(
      req.user.tenant,
      filters
    );
    
    res.json({
      success: true,
      dashboard
    });
  } catch (error) {
    console.error('Get intelligence dashboard error:', error);
    res.status(500).json({
      message: 'Error fetching intelligence dashboard',
      error: error.message
    });
  }
});

// Get stale clients
router.get('/stale-clients', auth, async (req, res) => {
  try {
    const { days = 14 } = req.query;
    const filters = buildFilters(req);
    
    const clients = await intelligenceService.getStaleClients(
      req.user.tenant,
      parseInt(days),
      filters
    );
    
    res.json({
      success: true,
      count: clients.length,
      clients
    });
  } catch (error) {
    console.error('Get stale clients error:', error);
    res.status(500).json({
      message: 'Error fetching stale clients',
      error: error.message
    });
  }
});

// Get stuck deals
router.get('/stuck-deals', auth, async (req, res) => {
  try {
    const { days = 45 } = req.query;
    const filters = buildFilters(req);
    
    const deals = await intelligenceService.getStuckDeals(
      req.user.tenant,
      parseInt(days),
      filters
    );
    
    res.json({
      success: true,
      count: deals.length,
      deals
    });
  } catch (error) {
    console.error('Get stuck deals error:', error);
    res.status(500).json({
      message: 'Error fetching stuck deals',
      error: error.message
    });
  }
});

// Get goal predictions
router.get('/goal-predictions', auth, async (req, res) => {
  try {
    const filters = buildFilters(req);
    
    const predictions = await intelligenceService.getGoalPredictions(
      req.user.tenant,
      filters
    );
    
    res.json({
      success: true,
      count: predictions.length,
      predictions
    });
  } catch (error) {
    console.error('Get goal predictions error:', error);
    res.status(500).json({
      message: 'Error fetching goal predictions',
      error: error.message
    });
  }
});

// Get overdue follow-ups
router.get('/overdue-followups', auth, async (req, res) => {
  try {
    const filters = buildFilters(req);
    
    const followUps = await intelligenceService.getOverdueFollowUps(
      req.user.tenant,
      filters
    );
    
    res.json({
      success: true,
      count: followUps.length,
      followUps
    });
  } catch (error) {
    console.error('Get overdue follow-ups error:', error);
    res.status(500).json({
      message: 'Error fetching overdue follow-ups',
      error: error.message
    });
  }
});

// Get deals closing soon
router.get('/deals-closing-soon', auth, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const filters = buildFilters(req);
    
    const deals = await intelligenceService.getDealsClosingSoon(
      req.user.tenant,
      parseInt(days),
      filters
    );
    
    res.json({
      success: true,
      count: deals.length,
      deals
    });
  } catch (error) {
    console.error('Get deals closing soon error:', error);
    res.status(500).json({
      message: 'Error fetching deals closing soon',
      error: error.message
    });
  }
});

// Get low activity users
router.get('/low-activity-users', auth, async (req, res) => {
  try {
    // Only admins and managers can see this
    if (!['superadmin', 'admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }
    
    const filters = buildFilters(req);
    
    const users = await intelligenceService.getLowActivityUsers(
      req.user.tenant,
      filters
    );
    
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Get low activity users error:', error);
    res.status(500).json({
      message: 'Error fetching low activity users',
      error: error.message
    });
  }
});

// Helper function to build filters based on user role
function buildFilters(req) {
  const filters = {};
  
  // Apply role-based filtering
  if (!['superadmin', 'admin'].includes(req.user.role)) {
    if (req.user.role === 'manager') {
      filters.departmentId = req.user.department;
    } else {
      filters.userId = req.user._id;
    }
  }
  
  // Allow query overrides for admins/managers
  if (['superadmin', 'admin', 'manager'].includes(req.user.role)) {
    if (req.query.userId) filters.userId = req.query.userId;
    if (req.query.teamId) filters.teamId = req.query.teamId;
    if (req.query.departmentId) filters.departmentId = req.query.departmentId;
    if (req.query.branchId) filters.branchId = req.query.branchId;
  }
  
  return filters;
}

export default router;
