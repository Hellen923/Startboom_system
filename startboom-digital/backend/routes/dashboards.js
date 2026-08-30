import express from 'express';
import Dashboard from '../models/Dashboard.js';
import User from '../models/User.js';
import Client from '../models/Client.js';
import Deal from '../models/Deal.js';
import Sale from '../models/Sale.js';
import { tenantAuth, requireRole } from '../middleware/tenantAuth.js';
import { logAction } from '../utils/auditLog.js';

const router = express.Router();

// Apply tenant authentication
router.use(tenantAuth);


router.use(tenantAuth);

// Get all dashboards for current user
router.get('/', async (req, res) => {
  try {
    const query = req.isSuperAdmin
      ? { user: req.user.userId }
      : { user: req.user.userId, tenant: req.tenantId };

    const dashboards = await Dashboard.find(query)
      .sort({ updatedAt: -1 })
      .lean();

    res.json({ dashboards });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get dashboard by ID
router.get('/:id', async (req, res) => {
  try {
    const query = req.isSuperAdmin
      ? { _id: req.params.id, user: req.user.userId }
      : { _id: req.params.id, user: req.user.userId, tenant: req.tenantId };

    const dashboard = await Dashboard.findOne(query).lean();
    if (!dashboard) return res.status(404).json({ message: 'Dashboard not found' });

    res.json({ dashboard });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── OPTIMIZED DASHBOARD SUMMARY ENDPOINTS ───────────────────────────────────
/**
 * GET /api/dashboards/admin-summary
 * Optimized endpoint for admin dashboard - uses aggregation instead of fetching all records
 */
router.get('/summary/admin', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const tenantQuery = req.isSuperAdmin ? {} : { tenant: req.tenantId };
    
    const dateFilter = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      dateFilter.createdAt = { $gte: start, $lte: end };
    }

    // Use MongoDB aggregation for better performance
    const [
      salesAggregation,
      dealsAggregation,
      clientsCount,
      usersCount,
      monthlySalesRevenue
    ] = await Promise.all([
      // Total sales and revenue in period
      Sale.aggregate([
        { $match: { ...tenantQuery, ...(startDate && endDate ? { saleDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } : {}) } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$finalAmount' },
            totalSales: { $sum: 1 }
          }
        }
      ]),

      // Deals summary
      Deal.aggregate([
        { $match: { ...tenantQuery, ...dateFilter } },
        {
          $group: {
            _id: '$stage',
            count: { $sum: 1 },
            totalValue: { $sum: '$value' }
          }
        }
      ]),

      // Total clients count
      Client.countDocuments({ ...tenantQuery }),

      // Total users count
      User.countDocuments({ ...tenantQuery }),

      // Monthly sales revenue breakdown (last 12 months)
      Sale.aggregate([
        { $match: { ...tenantQuery, saleDate: { $exists: true } } },
        {
          $group: {
            _id: { $month: '$saleDate' },
            revenue: { $sum: '$finalAmount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ])
    ]);

    // Process sales data
    const salesData = salesAggregation[0] || { totalRevenue: 0, totalSales: 0 };

    // Process deals data
    const dealsData = {
      total: 0,
      won: 0,
      lost: 0,
      pending: 0,
      byStage: {}
    };

    dealsAggregation.forEach(item => {
      const stage = (item._id || '').toLowerCase();
      dealsData.total += item.count;
      dealsData.byStage[stage] = {
        count: item.count,
        value: item.totalValue || 0
      };

      if (stage === 'won') dealsData.won = item.count;
      else if (stage === 'lost') dealsData.lost = item.count;
      else dealsData.pending += item.count;
    });

    // Process monthly sales revenue
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlySalesData = monthNames.map((month, idx) => {
      const monthData = monthlySalesRevenue.find(m => m._id === idx + 1);
      return {
        month,
        revenue: monthData?.revenue || 0,
        sales: monthData?.count || 0
      };
    });

    res.json({
      summary: {
        sales: salesData,
        deals: dealsData,
        clients: clientsCount,
        users: usersCount
      },
      charts: {
        monthlySales: monthlySalesData
      }
    });

  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ message: 'Failed to load dashboard summary', error: error.message });
  }
});

/**
 * GET /api/dashboards/agent-summary
 * Optimized endpoint for agent dashboard
 */
router.get('/summary/agent', async (req, res) => {
  try {
    const agentId = req.user.userId;
    const { startDate, endDate } = req.query;
    const tenantQuery = req.isSuperAdmin ? {} : { tenant: req.tenantId };

    const dateFilter = startDate && endDate
      ? { $gte: new Date(startDate), $lte: new Date(endDate) }
      : undefined;

    const [salesData, dealsData, clientsCount] = await Promise.all([
      // Agent's sales
      Sale.aggregate([
        { $match: { agent: agentId, ...tenantQuery, ...(dateFilter && { saleDate: dateFilter }) } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$finalAmount' },
            totalSales: { $sum: 1 }
          }
        }
      ]),

      // Agent's deals
      Deal.aggregate([
        { $match: { agent: agentId, ...tenantQuery } },
        {
          $group: {
            _id: '$stage',
            count: { $sum: 1 }
          }
        }
      ]),

      // Agent's clients
      Client.countDocuments({ agent: agentId, ...tenantQuery })
    ]);

    const sales = salesData[0] || { totalRevenue: 0, totalSales: 0 };
    const deals = {
      total: 0,
      won: 0,
      active: 0,
      lost: 0
    };

    dealsData.forEach(item => {
      const stage = (item._id || '').toLowerCase();
      deals.total += item.count;

      if (stage === 'won') deals.won = item.count;
      else if (stage === 'lost') deals.lost = item.count;
      else deals.active += item.count;
    });

    res.json({
      sales,
      deals,
      clients: clientsCount
    });

  } catch (error) {
    console.error('Agent dashboard summary error:', error);
    res.status(500).json({ message: 'Failed to load agent summary', error: error.message });
  }
});

// ─── END OPTIMIZED ENDPOINTS ─────────────────────────────────────────────────

// Create new dashboard
router.post('/', async (req, res) => {
  try {
    const { name, description, isDefault, isPublic, layout, widgets, filters } = req.body;

    if (!req.tenantId && !req.isSuperAdmin) {
      return res.status(400).json({ message: 'Tenant context is required' });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await Dashboard.updateMany(
        { user: req.user.userId, tenant: req.tenantId },
        { isDefault: false }
      );
    }

    const dashboard = await Dashboard.create({
      tenant: req.tenantId,
      user: req.user.userId,
      name,
      description,
      isDefault,
      isPublic,
      layout,
      widgets,
      filters
    });

    await logAction(req, 'CREATE_DASHBOARD', `Created dashboard ${dashboard.name}`, {
      entityType: 'Dashboard',
      entityId: dashboard._id
    });

    res.status(201).json({ dashboard });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update dashboard
router.put('/:id', async (req, res) => {
  try {
    const query = req.isSuperAdmin
      ? { _id: req.params.id, user: req.user.userId }
      : { _id: req.params.id, user: req.user.userId, tenant: req.tenantId };

    const dashboard = await Dashboard.findOne(query);
    if (!dashboard) return res.status(404).json({ message: 'Dashboard not found' });

    const updates = {};
    ['name', 'description', 'isDefault', 'isPublic', 'layout', 'widgets', 'filters'].forEach(key => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    // If setting as default, unset other defaults
    if (updates.isDefault) {
      await Dashboard.updateMany(
        { user: req.user.userId, tenant: req.tenantId, _id: { $ne: req.params.id } },
        { isDefault: false }
      );
    }

    Object.assign(dashboard, updates);
    await dashboard.save();

    await logAction(req, 'UPDATE_DASHBOARD', `Updated dashboard ${dashboard.name}`, {
      entityType: 'Dashboard',
      entityId: dashboard._id
    });

    res.json({ dashboard });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete dashboard
router.delete('/:id', async (req, res) => {
  try {
    const query = req.isSuperAdmin
      ? { _id: req.params.id, user: req.user.userId }
      : { _id: req.params.id, user: req.user.userId, tenant: req.tenantId };

    const dashboard = await Dashboard.findOneAndDelete(query);
    if (!dashboard) return res.status(404).json({ message: 'Dashboard not found' });

    await logAction(req, 'DELETE_DASHBOARD', `Deleted dashboard ${dashboard.name}`, {
      entityType: 'Dashboard',
      entityId: dashboard._id
    });

    res.json({ message: 'Dashboard deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get KPI data for dashboard widgets
router.get('/:id/kpis', async (req, res) => {
  try {
    const dashboard = await Dashboard.findById(req.params.id);
    if (!dashboard) return res.status(404).json({ message: 'Dashboard not found' });

    const tenantQuery = req.isSuperAdmin ? {} : { tenant: req.tenantId };
    const dateFilter = {};

    // Apply date filters if specified
    if (dashboard.filters?.dateRange?.start) {
      dateFilter.$gte = new Date(dashboard.filters.dateRange.start);
    }
    if (dashboard.filters?.dateRange?.end) {
      dateFilter.$lte = new Date(dashboard.filters.dateRange.end);
    }

    // Apply agent filters
    const agentFilter = {};
    if (dashboard.filters?.agents?.length > 0) {
      agentFilter.agent = { $in: dashboard.filters.agents };
    }

    const kpis = {};

    // Calculate KPIs based on widget configurations
    for (const widget of dashboard.widgets) {
      if (!widget.isActive) continue;

      switch (widget.type) {
        case 'kpi':
          kpis[widget.id] = await calculateKPI(widget.config, tenantQuery, dateFilter, agentFilter);
          break;
        case 'chart':
          kpis[widget.id] = await calculateChartData(widget.config, tenantQuery, dateFilter, agentFilter);
          break;
        case 'metric':
          kpis[widget.id] = await calculateMetric(widget.config, tenantQuery, dateFilter, agentFilter);
          break;
      }
    }

    res.json({ kpis });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper functions for KPI calculations
async function calculateKPI(config, tenantQuery, dateFilter, agentFilter) {
  const { metric, period } = config;

  switch (metric) {
    case 'total_clients':
      const totalClients = await Client.countDocuments({
        ...tenantQuery,
        ...agentFilter,
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
      });
      return { value: totalClients, label: 'Total Clients' };

    case 'active_deals':
      const activeDeals = await Deal.countDocuments({
        ...tenantQuery,
        ...agentFilter,
        stage: { $in: ['proposal', 'negotiation', 'review'] },
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
      });
      return { value: activeDeals, label: 'Active Deals' };

    case 'monthly_sales':
      const monthlySales = await Sale.aggregate([
        {
          $match: {
            ...tenantQuery,
            ...agentFilter,
            status: 'completed',
            ...(Object.keys(dateFilter).length > 0 && { saleDate: dateFilter })
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$finalAmount' }
          }
        }
      ]);
      return {
        value: monthlySales[0]?.total || 0,
        label: 'Monthly Sales',
        format: 'currency'
      };

    case 'conversion_rate':
      const totalDeals = await Deal.countDocuments({
        ...tenantQuery,
        ...agentFilter,
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
      });
      const wonDeals = await Deal.countDocuments({
        ...tenantQuery,
        ...agentFilter,
        stage: 'won',
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
      });
      const rate = totalDeals > 0 ? (wonDeals / totalDeals * 100) : 0;
      return {
        value: Math.round(rate * 100) / 100,
        label: 'Conversion Rate',
        format: 'percentage'
      };

    default:
      return { value: 0, label: 'Unknown Metric' };
  }
}

async function calculateChartData(config, tenantQuery, dateFilter, agentFilter) {
  const { chartType, metric, groupBy } = config;

  switch (metric) {
    case 'sales_trend':
      return await getSalesTrendData(tenantQuery, dateFilter, agentFilter);
    case 'deal_status':
      return await getDealStatusData(tenantQuery, dateFilter, agentFilter);
    case 'client_growth':
      return await getClientGrowthData(tenantQuery, dateFilter, agentFilter);
    case 'performance_trend':
      return await getPerformanceTrendData(tenantQuery, dateFilter, agentFilter);
    default:
      return { data: [], labels: [] };
  }
}

// Helper functions for chart data
async function getSalesTrendData(tenantQuery, dateFilter, agentFilter) {
  const salesData = await Sale.aggregate([
    {
      $match: {
        ...tenantQuery,
        ...agentFilter,
        status: 'completed',
        ...(Object.keys(dateFilter).length > 0 && { saleDate: dateFilter })
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$saleDate' },
          month: { $month: '$saleDate' }
        },
        total: { $sum: '$finalAmount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    },
    {
      $project: {
        name: {
          $concat: [
            { $toString: '$_id.month' },
            '/',
            { $toString: { $mod: ['$_id.year', 100] } }
          ]
        },
        value: '$total',
        count: 1
      }
    }
  ]);

  return { data: salesData };
}

async function getDealStatusData(tenantQuery, dateFilter, agentFilter) {
  const dealData = await Deal.aggregate([
    {
      $match: {
        ...tenantQuery,
        ...agentFilter,
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
      }
    },
    {
      $group: {
        _id: '$stage',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        name: {
          $switch: {
            branches: [
              { case: { $eq: ['$_id', 'prospect'] }, then: 'Prospect' },
              { case: { $eq: ['$_id', 'proposal'] }, then: 'Proposal' },
              { case: { $eq: ['$_id', 'negotiation'] }, then: 'Negotiation' },
              { case: { $eq: ['$_id', 'review'] }, then: 'Review' },
              { case: { $eq: ['$_id', 'won'] }, then: 'Won' },
              { case: { $eq: ['$_id', 'lost'] }, then: 'Lost' }
            ],
            default: 'Unknown'
          }
        },
        value: '$count'
      }
    }
  ]);

  return { data: dealData };
}

async function getClientGrowthData(tenantQuery, dateFilter, agentFilter) {
  const clientData = await Client.aggregate([
    {
      $match: {
        ...tenantQuery,
        ...agentFilter,
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    },
    {
      $project: {
        name: {
          $concat: [
            { $toString: '$_id.month' },
            '/',
            { $toString: { $mod: ['$_id.year', 100] } }
          ]
        },
        value: '$count'
      }
    }
  ]);

  return { data: clientData };
}

async function getPerformanceTrendData(tenantQuery, dateFilter, agentFilter) {
  // Performance trend data - could be based on deal closures or sales targets
  const performanceData = await Deal.aggregate([
    {
      $match: {
        ...tenantQuery,
        ...agentFilter,
        ...(Object.keys(dateFilter).length > 0 && { updatedAt: dateFilter })
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$updatedAt' },
          month: { $month: '$updatedAt' }
        },
        won: {
          $sum: { $cond: [{ $eq: ['$stage', 'won'] }, 1, 0] }
        },
        total: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    },
    {
      $project: {
        name: {
          $concat: [
            { $toString: '$_id.month' },
            '/',
            { $toString: { $mod: ['$_id.year', 100] } }
          ]
        },
        value: {
          $multiply: [
            { $divide: ['$won', { $max: ['$total', 1] }] },
            100
          ]
        }
      }
    }
  ]);

  return { data: performanceData };
}

async function calculateMetric(config, tenantQuery, dateFilter, agentFilter) {
  // Custom metric calculations
  return { value: 0, trend: 0 };
}

export { router as dashboardRoutes };