import express from 'express';
import Deal from '../models/Deal.js';
import Client from '../models/Client.js';
import Sale from '../models/Sale.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/analytics/conversion
// @desc    Get conversion rate analytics (40% benchmark)
// @access  Private (Admin/Manager)
router.get('/conversion', auth, async (req, res) => {
  try {
    const { startDate, endDate, agentId } = req.query;

    const query = { tenant: req.user.tenant };

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Agent filter
    if (agentId) {
      query.assignedTo = agentId;
    }

    // Get total deals
    const totalDeals = await Deal.countDocuments(query);

    // Get converted deals (won)
    const convertedDeals = await Deal.countDocuments({
      ...query,
      stage: 'won'
    });

    // Get lost deals
    const lostDeals = await Deal.countDocuments({
      ...query,
      stage: 'lost'
    });

    // Calculate conversion rate
    const conversionRate = totalDeals > 0 ? (convertedDeals / totalDeals) * 100 : 0;

    // 40% benchmark
    const benchmarkRate = 40;
    const benchmarkDifference = conversionRate - benchmarkRate;

    // Get conversion by stage
    const dealsByStage = await Deal.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$stage',
          count: { $sum: 1 },
          totalValue: { $sum: '$value' }
        }
      }
    ]);

    res.json({
      totalDeals,
      convertedDeals,
      lostDeals,
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      benchmarkRate,
      benchmarkDifference: parseFloat(benchmarkDifference.toFixed(2)),
      performsAboveBenchmark: conversionRate >= benchmarkRate,
      dealsByStage,
      period: {
        startDate: startDate || null,
        endDate: endDate || null
      }
    });
  } catch (error) {
    console.error('Error fetching conversion analytics:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/analytics/clients/activity
// @desc    Get active vs dormant clients
// @access  Private (Admin/Manager)
router.get('/clients/activity', auth, async (req, res) => {
  try {
    const { dormantDays = 90 } = req.query;

    const dormantThreshold = new Date();
    dormantThreshold.setDate(dormantThreshold.getDate() - parseInt(dormantDays));

    const query = { tenant: req.user.tenant };

    // Total clients
    const totalClients = await Client.countDocuments(query);

    // Active clients (have recent deals or sales)
    const activeClientIds = await Sale.distinct('client', {
      tenant: req.user.tenant,
      saleDate: { $gte: dormantThreshold }
    });

    const activeClients = activeClientIds.length;
    const dormantClients = totalClients - activeClients;

    // Get top active clients
    const topActiveClients = await Sale.aggregate([
      {
        $match: {
          tenant: req.user.tenant,
          saleDate: { $gte: dormantThreshold },
          client: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$client',
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$finalAmount' },
          lastSaleDate: { $max: '$saleDate' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'clients',
          localField: '_id',
          foreignField: '_id',
          as: 'clientInfo'
        }
      },
      { $unwind: '$clientInfo' }
    ]);

    // Get dormant clients needing attention
    const dormantClientsNeedingAttention = await Client.find({
      ...query,
      _id: { $nin: activeClientIds },
      status: { $in: ['active', 'qualified'] }
    })
      .select('name email phone company lastContactDate')
      .sort({ lastContactDate: -1 })
      .limit(20)
      .lean();

    res.json({
      totalClients,
      activeClients,
      dormantClients,
      activePercentage: totalClients > 0 ? parseFloat(((activeClients / totalClients) * 100).toFixed(2)) : 0,
      dormantPercentage: totalClients > 0 ? parseFloat(((dormantClients / totalClients) * 100).toFixed(2)) : 0,
      dormantThresholdDays: parseInt(dormantDays),
      topActiveClients,
      dormantClientsNeedingAttention
    });
  } catch (error) {
    console.error('Error fetching client activity:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/analytics/agents/leaderboard
// @desc    Get agent performance leaderboard
// @access  Private
router.get('/agents/leaderboard', auth, async (req, res) => {
  try {
    const { startDate, endDate, territoryId } = req.query;

    const query = {
      tenant: req.user.tenant,
      role: { $in: ['agent', 'manager'] },
      isActive: true
    };

    // Get all agents
    const agents = await User.find(query)
      .select('firstName lastName email role phone')
      .lean();

    // Calculate performance for each agent
    const leaderboard = await Promise.all(
      agents.map(async (agent) => {
        const salesQuery = {
          tenant: req.user.tenant,
          agent: agent._id,
          status: 'completed'
        };

        const dealsQuery = {
          tenant: req.user.tenant,
          assignedTo: agent._id
        };

        // Date range filter
        if (startDate || endDate) {
          salesQuery.saleDate = {};
          dealsQuery.createdAt = {};
          if (startDate) {
            salesQuery.saleDate.$gte = new Date(startDate);
            dealsQuery.createdAt.$gte = new Date(startDate);
          }
          if (endDate) {
            salesQuery.saleDate.$lte = new Date(endDate);
            dealsQuery.createdAt.$lte = new Date(endDate);
          }
        }

        // Get sales data
        const salesStats = await Sale.aggregate([
          { $match: salesQuery },
          {
            $group: {
              _id: null,
              totalSales: { $sum: 1 },
              totalRevenue: { $sum: '$finalAmount' }
            }
          }
        ]);

        // Get deals data
        const totalDeals = await Deal.countDocuments(dealsQuery);
        const wonDeals = await Deal.countDocuments({
          ...dealsQuery,
          stage: 'won'
        });

        const stats = salesStats[0] || { totalSales: 0, totalRevenue: 0 };

        // Calculate performance score
        const performanceScore = (wonDeals * 100) + (stats.totalRevenue * 0.01) + (stats.totalSales * 50);

        return {
          agent: {
            id: agent._id,
            name: `${agent.firstName} ${agent.lastName}`,
            email: agent.email,
            role: agent.role,
            phone: agent.phone
          },
          stats: {
            totalSales: stats.totalSales,
            totalRevenue: stats.totalRevenue,
            totalDeals,
            wonDeals,
            conversionRate: totalDeals > 0 ? parseFloat(((wonDeals / totalDeals) * 100).toFixed(2)) : 0
          },
          performanceScore: parseFloat(performanceScore.toFixed(2))
        };
      })
    );

    // Sort by performance score
    leaderboard.sort((a, b) => b.performanceScore - a.performanceScore);

    // Add rank
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    res.json({
      leaderboard,
      period: {
        startDate: startDate || null,
        endDate: endDate || null
      }
    });
  } catch (error) {
    console.error('Error fetching agent leaderboard:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard analytics summary
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    const { period = '30' } = req.query; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const query = {
      tenant: req.user.tenant,
      createdAt: { $gte: startDate }
    };

    // Parallel queries for efficiency
    const [
      totalSales,
      totalRevenue,
      totalDeals,
      wonDeals,
      totalClients,
      newClients
    ] = await Promise.all([
      Sale.countDocuments({ ...query, status: 'completed' }),
      Sale.aggregate([
        { $match: { ...query, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$finalAmount' } } }
      ]),
      Deal.countDocuments(query),
      Deal.countDocuments({ ...query, stage: 'won' }),
      Client.countDocuments({ tenant: req.user.tenant }),
      Client.countDocuments(query)
    ]);

    const revenue = totalRevenue[0]?.total || 0;
    const conversionRate = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0;

    res.json({
      period: parseInt(period),
      totalSales,
      totalRevenue: revenue,
      totalDeals,
      wonDeals,
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      totalClients,
      newClients,
      averageDealValue: wonDeals > 0 ? parseFloat((revenue / wonDeals).toFixed(2)) : 0
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
