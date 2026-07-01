import express from 'express';
import Deal from '../models/Deal.js';
import Client from '../models/Client.js';
import Sale from '../models/Sale.js';
import User from '../models/User.js';
import { tenantAuth, requireRole } from '../middleware/tenantAuth.js';

const router = express.Router();

// Apply tenant-aware auth to ALL routes
router.use(tenantAuth);

// GET /api/analytics/conversion
router.get('/conversion', requireRole(['admin', 'manager', 'superadmin']), async (req, res) => {
  try {
    const { startDate, endDate, agentId } = req.query;
    const query = { ...req.tenantQuery };
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    if (agentId) query.assignedTo = agentId;
    const totalDeals = await Deal.countDocuments(query);
    const convertedDeals = await Deal.countDocuments({ ...query, stage: 'won' });
    const lostDeals = await Deal.countDocuments({ ...query, stage: 'lost' });
    const conversionRate = totalDeals > 0 ? (convertedDeals / totalDeals) * 100 : 0;
    const benchmarkRate = 40;
    const dealsByStage = await Deal.aggregate([
      { $match: query },
      { $group: { _id: '$stage', count: { $sum: 1 }, totalValue: { $sum: '$value' } } }
    ]);
    res.json({
      totalDeals, convertedDeals, lostDeals,
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      benchmarkRate,
      benchmarkDifference: parseFloat((conversionRate - benchmarkRate).toFixed(2)),
      performsAboveBenchmark: conversionRate >= benchmarkRate,
      dealsByStage,
      period: { startDate: startDate || null, endDate: endDate || null }
    });
  } catch (error) {
    console.error('Error fetching conversion analytics:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/analytics/clients/activity
router.get('/clients/activity', requireRole(['admin', 'manager', 'superadmin']), async (req, res) => {
  try {
    const { dormantDays = 90 } = req.query;
    const dormantThreshold = new Date();
    dormantThreshold.setDate(dormantThreshold.getDate() - parseInt(dormantDays));
    const query = { ...req.tenantQuery };
    const totalClients = await Client.countDocuments(query);
    const activeClientIds = await Sale.distinct('client', { ...req.tenantQuery, saleDate: { $gte: dormantThreshold } });
    const activeClients = activeClientIds.length;
    const dormantClients = totalClients - activeClients;
    const topActiveClients = await Sale.aggregate([
      { $match: { ...req.tenantQuery, saleDate: { $gte: dormantThreshold }, client: { $exists: true } } },
      { $group: { _id: '$client', totalSales: { $sum: 1 }, totalRevenue: { $sum: '$finalAmount' }, lastSaleDate: { $max: '$saleDate' } } },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'clients', localField: '_id', foreignField: '_id', as: 'clientInfo' } },
      { $unwind: '$clientInfo' }
    ]);
    const dormantClientsNeedingAttention = await Client.find({
      ...query, _id: { $nin: activeClientIds }, status: { $in: ['active', 'qualified'] }
    }).select('name email phone company lastContactDate').sort({ lastContactDate: -1 }).limit(20).lean();
    res.json({
      totalClients, activeClients, dormantClients,
      activePercentage: totalClients > 0 ? parseFloat(((activeClients / totalClients) * 100).toFixed(2)) : 0,
      dormantPercentage: totalClients > 0 ? parseFloat(((dormantClients / totalClients) * 100).toFixed(2)) : 0,
      dormantThresholdDays: parseInt(dormantDays),
      topActiveClients, dormantClientsNeedingAttention
    });
  } catch (error) {
    console.error('Error fetching client activity:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/analytics/agents/leaderboard
router.get('/agents/leaderboard', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const agentQuery = { ...req.tenantQuery, role: { $in: ['agent', 'manager'] }, isActive: true };
    const agents = await User.find(agentQuery).select('name email role phone').lean();
    const leaderboard = await Promise.all(agents.map(async (agent) => {
      const salesQuery = { ...req.tenantQuery, agent: agent._id, status: 'completed' };
      const dealsQuery = { ...req.tenantQuery, agent: agent._id };
      if (startDate || endDate) {
        salesQuery.saleDate = {};
        dealsQuery.createdAt = {};
        if (startDate) { salesQuery.saleDate.$gte = new Date(startDate); dealsQuery.createdAt.$gte = new Date(startDate); }
        if (endDate) { salesQuery.saleDate.$lte = new Date(endDate); dealsQuery.createdAt.$lte = new Date(endDate); }
      }
      const salesStats = await Sale.aggregate([
        { $match: salesQuery },
        { $group: { _id: null, totalSales: { $sum: 1 }, totalRevenue: { $sum: '$finalAmount' } } }
      ]);
      const totalDeals = await Deal.countDocuments(dealsQuery);
      const wonDeals = await Deal.countDocuments({ ...dealsQuery, stage: 'won' });
      const stats = salesStats[0] || { totalSales: 0, totalRevenue: 0 };
      const performanceScore = (wonDeals * 100) + (stats.totalRevenue * 0.01) + (stats.totalSales * 50);
      return {
        agent: { id: agent._id, name: agent.name, email: agent.email, role: agent.role, phone: agent.phone },
        stats: { totalSales: stats.totalSales, totalRevenue: stats.totalRevenue, totalDeals, wonDeals, conversionRate: totalDeals > 0 ? parseFloat(((wonDeals / totalDeals) * 100).toFixed(2)) : 0 },
        performanceScore: parseFloat(performanceScore.toFixed(2))
      };
    }));
    leaderboard.sort((a, b) => b.performanceScore - a.performanceScore);
    leaderboard.forEach((entry, i) => { entry.rank = i + 1; });
    res.json({ leaderboard, period: { startDate: startDate || null, endDate: endDate || null } });
  } catch (error) {
    console.error('Error fetching agent leaderboard:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/analytics/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    const query = { ...req.tenantQuery, createdAt: { $gte: startDate } };
    const [totalSales, totalRevenueAgg, totalDeals, wonDeals, totalClients, newClients] = await Promise.all([
      Sale.countDocuments({ ...query, status: 'completed' }),
      Sale.aggregate([{ $match: { ...query, status: 'completed' } }, { $group: { _id: null, total: { $sum: '$finalAmount' } } }]),
      Deal.countDocuments(query),
      Deal.countDocuments({ ...query, stage: 'won' }),
      Client.countDocuments({ ...req.tenantQuery }),
      Client.countDocuments(query)
    ]);
    const revenue = totalRevenueAgg[0]?.total || 0;
    const conversionRate = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0;
    res.json({
      period: parseInt(period), totalSales, totalRevenue: revenue, totalDeals, wonDeals,
      conversionRate: parseFloat(conversionRate.toFixed(2)), totalClients, newClients,
      averageDealValue: wonDeals > 0 ? parseFloat((revenue / wonDeals).toFixed(2)) : 0
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
