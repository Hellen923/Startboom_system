import express from 'express';
import { auth } from '../middleware/auth.js';
import { tenantAuth } from '../middleware/tenantAuth.js';
import {
  calculateUserMetrics,
  calculateTeamMetrics,
  calculateDepartmentMetrics,
  calculateCompanyMetrics,
  getCascadingMetrics
} from '../services/metricAggregationService.js';

const router = express.Router();

// Get user metrics
router.get('/user/:userId', auth, tenantAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    const metrics = await calculateUserMetrics(
      userId,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );

    res.json({ metrics });
  } catch (error) {
    console.error('Error fetching user metrics:', error);
    res.status(500).json({ 
      message: 'Failed to fetch user metrics', 
      error: error.message 
    });
  }
});

// Get current user's metrics
router.get('/my-metrics', auth, tenantAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const metrics = await calculateUserMetrics(
      req.user._id,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );

    res.json({ metrics });
  } catch (error) {
    console.error('Error fetching my metrics:', error);
    res.status(500).json({ 
      message: 'Failed to fetch metrics', 
      error: error.message 
    });
  }
});

// Get team metrics
router.get('/team/:teamId', auth, tenantAuth, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { startDate, endDate } = req.query;

    const metrics = await calculateTeamMetrics(
      teamId,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );

    res.json({ metrics });
  } catch (error) {
    console.error('Error fetching team metrics:', error);
    res.status(500).json({ 
      message: 'Failed to fetch team metrics', 
      error: error.message 
    });
  }
});

// Get department metrics
router.get('/department/:departmentId', auth, tenantAuth, async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { startDate, endDate } = req.query;

    const metrics = await calculateDepartmentMetrics(
      departmentId,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );

    res.json({ metrics });
  } catch (error) {
    console.error('Error fetching department metrics:', error);
    res.status(500).json({ 
      message: 'Failed to fetch department metrics', 
      error: error.message 
    });
  }
});

// Get company metrics
router.get('/company', auth, tenantAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const metrics = await calculateCompanyMetrics(
      req.user.tenant,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );

    res.json({ metrics });
  } catch (error) {
    console.error('Error fetching company metrics:', error);
    res.status(500).json({ 
      message: 'Failed to fetch company metrics', 
      error: error.message 
    });
  }
});

// Get cascading metrics (all levels for context)
router.get('/cascade/:level/:id', auth, tenantAuth, async (req, res) => {
  try {
    const { level, id } = req.params;
    const { startDate, endDate } = req.query;

    const metrics = await getCascadingMetrics(
      level,
      id,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );

    res.json({ metrics });
  } catch (error) {
    console.error('Error fetching cascading metrics:', error);
    res.status(500).json({ 
      message: 'Failed to fetch cascading metrics', 
      error: error.message 
    });
  }
});

// Get hierarchy metrics (user → team → department → company)
router.get('/hierarchy', auth, tenantAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const user = req.user;

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    const hierarchy = {
      user: null,
      team: null,
      department: null,
      company: null
    };

    // Get user metrics
    hierarchy.user = await calculateUserMetrics(user._id, start, end);

    // Get team metrics if user has team
    if (user.team) {
      hierarchy.team = await calculateTeamMetrics(user.team, start, end);
    }

    // Get department metrics if user has department
    if (user.department) {
      hierarchy.department = await calculateDepartmentMetrics(user.department, start, end);
    }

    // Get company metrics
    hierarchy.company = await calculateCompanyMetrics(user.tenant, start, end);

    res.json({ hierarchy });
  } catch (error) {
    console.error('Error fetching hierarchy metrics:', error);
    res.status(500).json({ 
      message: 'Failed to fetch hierarchy metrics', 
      error: error.message 
    });
  }
});

export default router;
