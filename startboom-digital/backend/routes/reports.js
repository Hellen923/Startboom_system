import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { sendEmailWithAttachment } from '../services/emailService.js';
import Client from '../models/Client.js';
import Deal from '../models/Deal.js';
import Schedule from '../models/Schedule.js';
import User from '../models/User.js';
import Sale from '../models/Sale.js';
import { tenantAuth } from '../middleware/tenantAuth.js';

const router = express.Router();

// Apply tenant-aware middleware to all routes
router.use(tenantAuth);

// Get Analytics Data
router.get('/analytics', async (req, res) => {
  try {
    const { start, end, agent } = req.query;

    const dateFilter = {};
    const saleDateFilter = {};
    if (start || end) {
      dateFilter.createdAt = {};
      saleDateFilter.saleDate = {};
      if (start) { dateFilter.createdAt.$gte = new Date(start); saleDateFilter.saleDate.$gte = new Date(start); }
      if (end) { dateFilter.createdAt.$lte = new Date(end); saleDateFilter.saleDate.$lte = new Date(end); }
    }

    const agentFilter = agent ? { agent } : {};
    if (req.user.role === 'agent') agentFilter.agent = req.user.userId;

    const dealFilter = { ...req.tenantQuery, ...dateFilter, ...agentFilter };
    const saleFilter = { ...req.tenantQuery, ...saleDateFilter, ...agentFilter };
    const clientFilter = { ...req.tenantQuery, ...dateFilter, ...agentFilter };
    const scheduleFilter = { ...req.tenantQuery, ...agentFilter };
    if (start || end) {
      scheduleFilter.date = {};
      if (start) scheduleFilter.date.$gte = new Date(start);
      if (end) scheduleFilter.date.$lte = new Date(end);
    }

    const agents = await User.find({ role: 'agent', ...req.tenantQuery }).select('name email _id');

    // 2. Fetch all data
    const [deals, schedules, sales, clients] = await Promise.all([
      Deal.find(dealFilter).populate('agent', 'name'),
      Schedule.find(scheduleFilter).populate('agent', 'name'),
      Sale.find(saleFilter).populate('agent', 'name'),
      Client.find(clientFilter).populate('agent', 'name')
    ]);

    // A. Summary Stats
    const totalRevenue = sales.reduce((sum, s) => sum + (Number(s.finalAmount) || 0), 0);
    const totalSales = sales.length;

    // Cash vs Credit Sales
    const cashSalesAmount = sales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + (Number(s.finalAmount) || 0), 0);
    const creditSalesAmount = sales.filter(s => s.paymentMethod === 'credit').reduce((sum, s) => sum + (Number(s.finalAmount) || 0), 0);
    const cashSalesCount = sales.filter(s => s.paymentMethod === 'cash').length;
    const creditSalesCount = sales.filter(s => s.paymentMethod === 'credit').length;

    // Deals Stats
    const totalDeals = deals.length;
    const dealsWon = deals.filter(d => d.stage === 'won').length;
    const dealsLost = deals.filter(d => d.stage === 'lost').length;
    const dealsInProgress = totalDeals - dealsWon - dealsLost;

    // Meeting Stats
    const clientsMet = schedules.filter(s => s.type === 'meeting' && s.status === 'completed').length;
    const totalSchedules = schedules.length;

    // Averages
    const avgRevenuePerSale = totalSales > 0 ? totalRevenue / totalSales : 0;
    const avgRevenuePerDealWon = dealsWon > 0 ? totalRevenue / dealsWon : 0; // Revenue comes from won deals (sales) usually

    // B. Weekly Breakdown
    const weeklyData = [];
    const weekMap = {};

    sales.forEach(sale => {
      const saleDate = new Date(sale.saleDate || sale.createdAt);
      const dayOfWeek = saleDate.getDay();
      const diff = saleDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const weekStart = new Date(saleDate.setDate(diff));
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weekMap[weekKey]) {
        weekMap[weekKey] = {
          weekStart: weekKey,
          weekDisplay: new Date(weekKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          revenue: 0,
          salesCount: 0,
          cashSales: 0,
          creditSales: 0,
          dealsWon: 0,
          clientsMet: 0,
          items: 0
        };
      }

      weekMap[weekKey].revenue += Number(sale.finalAmount) || 0;
      weekMap[weekKey].salesCount += 1;
      if (sale.paymentMethod === 'cash') weekMap[weekKey].cashSales += Number(sale.finalAmount) || 0;
      if (sale.paymentMethod === 'credit') weekMap[weekKey].creditSales += Number(sale.finalAmount) || 0;
      weekMap[weekKey].items += sale.items?.length || 0;
    });

    // Merge other data into Timeline (approximate by matching weeks)
    // Note: For deals/schedules we use createdAt/date. 
    // This is a simplified merge, ideally we'd iterate all dates. 
    // For now we map sales weeks, but we should ensure we capture weeks with NO sales but activity.
    // Let's build a robust week map from ALL activities.

    const addToWeekMap = (dateStr, type, value = 1) => {
      const d = new Date(dateStr);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(d.setDate(diff));
      const key = weekStart.toISOString().split('T')[0];

      if (!weekMap[key]) {
        weekMap[key] = {
          weekStart: key,
          weekDisplay: new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          revenue: 0, salesCount: 0, cashSales: 0, creditSales: 0,
          dealsWon: 0, clientsMet: 0, items: 0
        };
      }
      weekMap[key][type] = (weekMap[key][type] || 0) + value;
    };

    // Re-process Sales with robust map
    sales.forEach(s => {
      addToWeekMap(s.saleDate || s.createdAt, 'salesCount', 1);
      // We manually add revenue/amounts as addToWeekMap is simple counter mainly
      // But let's just use the robust map for counters and a separate pass for values if needed
      // Or just re-do the loop logic cleanly:
    });
    // This requires a refactor of the loop above. Let's stick to the simpler sales-driven loop for now 
    // but allow adding weeks from Deals/Schedules if not present? 
    // User wants "Clients Met", "Deals Won".

    // Let's refine the loop below to handle all:
    const unifiedWeekMap = {};
    const getWeekKey = (date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(d.setDate(diff));
      return {
        key: weekStart.toISOString().split('T')[0],
        display: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };
    };

    const ensureWeek = (key, display) => {
      if (!unifiedWeekMap[key]) {
        unifiedWeekMap[key] = {
          weekStart: key, weekDisplay: display,
          revenue: 0, cashSales: 0, creditSales: 0,
          salesCount: 0, dealsWon: 0, dealsLost: 0, clientsMet: 0
        };
      }
    };

    sales.forEach(s => {
      const { key, display } = getWeekKey(s.saleDate || s.createdAt);
      ensureWeek(key, display);
      unifiedWeekMap[key].revenue += Number(s.finalAmount) || 0;
      unifiedWeekMap[key].salesCount += 1;
      if (s.paymentMethod === 'cash') unifiedWeekMap[key].cashSales += Number(s.finalAmount) || 0;
      if (s.paymentMethod === 'credit') unifiedWeekMap[key].creditSales += Number(s.finalAmount) || 0;
    });

    deals.forEach(d => {
      const { key, display } = getWeekKey(d.createdAt);
      ensureWeek(key, display);
      if (d.stage === 'won') unifiedWeekMap[key].dealsWon += 1;
      if (d.stage === 'lost') unifiedWeekMap[key].dealsLost += 1;
    });

    schedules.forEach(s => {
      if (s.type === 'meeting' && s.status === 'completed') {
        const { key, display } = getWeekKey(s.date);
        ensureWeek(key, display);
        unifiedWeekMap[key].clientsMet += 1;
      }
    });

    Object.keys(unifiedWeekMap).sort((a, b) => b.localeCompare(a)).forEach(key => {
      weeklyData.push(unifiedWeekMap[key]);
    });


    // C. Agent Performance
    const agentStats = agents.map(a => {
      const aId = a._id.toString();
      const aDeals = deals.filter(d => d.agent?._id?.toString() === aId || d.agent?.toString() === aId);
      const aSales = sales.filter(s => s.agent?._id?.toString() === aId || s.agent?.toString() === aId);
      const aSchedules = schedules.filter(s => s.agent?._id?.toString() === aId || s.agent?.toString() === aId);

      const won = aDeals.filter(d => d.stage === 'won').length;
      const lost = aDeals.filter(d => d.stage === 'lost').length;
      const total = aDeals.length;
      const revenue = aSales.reduce((sum, s) => sum + (Number(s.finalAmount) || 0), 0);
      const salesCount = aSales.length;
      const meetings = aSchedules.filter(s => s.type === 'meeting' && s.status === 'completed').length;

      return {
        id: aId,
        name: a.name,
        totalDeals: total,
        wonDeals: won,
        lostDeals: lost,
        revenue,
        salesCount,
        meetings,
        avgRevenuePerSale: salesCount > 0 ? Math.round(revenue / salesCount) : 0,
        winRate: total > 0 ? ((won / total) * 100).toFixed(1) : 0
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // D. Sales Funnel (Revised)
    const salesFunnel = [
      { name: 'Schedules', value: totalSchedules, percentage: '100%' },
      { name: 'Clients Met', value: clientsMet, percentage: totalSchedules > 0 ? `${((clientsMet / totalSchedules) * 100).toFixed(1)}%` : '0%' },
      { name: 'Deals Won', value: dealsWon, percentage: totalDeals > 0 ? `${((dealsWon / totalDeals) * 100).toFixed(1)}%` : '0%' }, // Contextual percentage
      { name: 'Sales Completed', value: totalSales, percentage: dealsWon > 0 ? `${((totalSales / dealsWon) * 100).toFixed(1)}%` : '0%' } // Assuming Won Deal -> Sale
    ];

    // E. Charts Data
    // 1. Revenue & Sales Trend
    const trendMap = {};
    sales.forEach(s => {
      const date = new Date(s.saleDate || s.createdAt).toISOString().split('T')[0];
      if (!trendMap[date]) trendMap[date] = { date, revenue: 0, sales: 0 };
      trendMap[date].revenue += Number(s.finalAmount) || 0;
      trendMap[date].sales += 1;
    });

    const revenueTrend = Object.values(trendMap)
      .map(d =>({
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: d.revenue,
        sales: d.sales
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // 2. Deal Outcomes (Pie/Bar support)
    const dealOutcomes = [
      { name: 'Won', value: dealsWon },
      { name: 'Lost', value: dealsLost },
      { name: 'In Progress', value: dealsInProgress }
    ];

    // 3. Deals vs Goal (monthly comparison)
    const monthlyDealsMap = {};
    deals.forEach(d => {
      const month = new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!monthlyDealsMap[month]) monthlyDealsMap[month] = { month, closed: 0, goal: 10 }; // Default goal: 10 deals/month
      if (d.stage === 'won') monthlyDealsMap[month].closed += 1;
    });

    const dealsVsGoal = Object.values(monthlyDealsMap).slice(-6); // Last 6 months

    // 4. Revenue Comparison (monthly)
    const monthlyRevenueMap = {};
    sales.forEach(s => {
      const month = new Date(s.saleDate || s.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!monthlyRevenueMap[month]) monthlyRevenueMap[month] = { month, thisMonth: 0, lastMonth: 0 };
      monthlyRevenueMap[month].thisMonth += Number(s.finalAmount) || 0;
    });

    // Calculate last month for comparison
    const lastMonthStart = new Date();
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    const lastMonthEnd = new Date();
    lastMonthEnd.setDate(0); // Last day of previous month

    sales.filter(s => {
      const saleDate = new Date(s.saleDate || s.createdAt);
      return saleDate >= lastMonthStart && saleDate <= lastMonthEnd;
    }).forEach(s => {
      const month = new Date(s.saleDate || s.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (monthlyRevenueMap[month]) {
        monthlyRevenueMap[month].lastMonth += Number(s.finalAmount) || 0;
      }
    });

    const revenueComparison = Object.values(monthlyRevenueMap).slice(-6); // Last 6 months

    // 5. Sales Funnel Data
    const salesFunnelData = [
      { name: 'Leads', value: deals.filter(d => d.stage === 'lead').length },
      { name: 'Qualified', value: deals.filter(d => d.stage === 'qualification').length },
      { name: 'Proposal', value: deals.filter(d => d.stage === 'proposal').length },
      { name: 'Negotiation', value: deals.filter(d => d.stage === 'negotiation').length },
      { name: 'Won', value: deals.filter(d => d.stage === 'won').length },
      { name: 'Lost', value: deals.filter(d => d.stage === 'lost').length }
    ];

    res.json({
      summary: {
        totalRevenue,
        totalSales,
        cashSalesAmount,
        creditSalesAmount,
        cashSalesCount,
        creditSalesCount,
        totalDeals,
        dealsWon,
        dealsLost,
        clientsMet,
        avgRevenuePerSale: Math.round(avgRevenuePerSale),
        avgRevenuePerDealWon: Math.round(avgRevenuePerDealWon)
      },
      weeklyData,
      salesFunnel,
      agentPerformance: agentStats,
      charts: {
        revenueTrend,
        dealOutcomes,
        revenueByAgent: agentStats.slice(0, 10).map(a => ({ name: a.name, value: a.revenue })),
        dealsVsGoal,
        revenueComparison,
        salesFunnel: salesFunnelData
      },
      logs: {
        schedules: schedules.slice(0, 50)
      }
    });

  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics', error: error.message });
  }
});

const calculateRating = (won, total, revenue) => {
  const rate = total > 0 ? (won / total) : 0;
  if (rate >= 0.8 && revenue > 50000) return 5;
  if (rate >= 0.6 && revenue > 20000) return 4;
  if (rate >= 0.4) return 3;
  if (rate >= 0.2) return 2;
  return 1;
};

// Setup multer for file uploads (temporary storage)
const upload = multer({ dest: 'uploads/' });

// Share report via email - expects { to, subject, html, csv, filename }
router.post('/share', async (req, res) => {
  try {
    const { to, subject, html, csv, filename = 'report.csv' } = req.body;
    if (!to || !csv) return res.status(400).json({ message: 'Missing to or csv content' });

    const buffer = Buffer.from(csv, 'utf8');
    const attachments = [{ filename, content: buffer }];

    const result = await sendEmailWithAttachment(to, subject || 'CRM Report', html, attachments);
    if (!result.success) return res.status(500).json({ message: 'Failed to send email', error: result.error });
    res.json({ message: 'Report shared successfully' });
  } catch (error) {
    console.error('Share report error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Import CSV file - optional query param target: deals|clients|schedules
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    const target = req.body.target || 'deals';
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const filePath = path.resolve(req.file.path);
    const content = fs.readFileSync(filePath, 'utf8');

    // Simple CSV parse: first line headers, comma-separated
    const lines = content.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length < 2) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: 'CSV contains no data' });
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      const cols = line.split(',');
      const obj = {};
      headers.forEach((h, i) => { obj[h] = cols[i] ? cols[i].trim() : ''; });
      return obj;
    });

    const created = [];

    if (target === 'clients') {
      for (const row of rows) {
        // required: name,email,phone,nin,agent
        if (!row.name || !row.email || !row.phone || !row.nin || !row.agent) continue;
        try {
          const c = new Client({ name: row.name, email: row.email, phone: row.phone, nin: row.nin, agent: row.agent });
          const saved = await c.save();
          created.push({ type: 'client', id: saved._id });
        } catch (e) {
          console.warn('Failed to create client row', row, e.message);
        }
      }
    } else if (target === 'schedules') {
      for (const row of rows) {
        // expect: agent,client,date,status,type,duration,notes
        try {
          const s = new Schedule({
            agent: row.agent,
            client: row.client,
            date: row.date ? new Date(row.date) : new Date(),
            status: row.status || 'scheduled',
            type: row.type || 'meeting',
            duration: row.duration || 30,
            notes: row.notes || ''
          });
          const saved = await s.save();
          created.push({ type: 'schedule', id: saved._id });
        } catch (e) {
          console.warn('Failed to create schedule row', row, e.message);
        }
      }
    } else {
      // default deals
      for (const row of rows) {
        try {
          const d = new Deal({
            title: row.title || `Imported Deal ${Date.now()}`,
            description: row.description || '',
            value: Number(row.value) || 0,
            client: row.client || null,
            agent: row.agent || null,
            stage: row.stage || 'lead',
            probability: Number(row.probability) || 0,
            expectedCloseDate: row.expectedCloseDate ? new Date(row.expectedCloseDate) : null
          });
          const saved = await d.save();
          created.push({ type: 'deal', id: saved._id });
        } catch (e) {
          console.warn('Failed to create deal row', row, e.message);
        }
      }
    }

    // cleanup temp file
    fs.unlinkSync(filePath);

    res.json({ message: 'Import completed', createdCount: created.length, created });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export { router as reportsRoutes };
