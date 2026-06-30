import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Tenant from '../models/Tenant.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import Client from '../models/Client.js';
import Deal from '../models/Deal.js';
import Sale from '../models/Sale.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';
import SecurityBlock from '../models/SecurityBlock.js';
import Performance from '../models/Performance.js';
import Meeting from '../models/Meeting.js';
import Schedule from '../models/Schedule.js';
import Stock from '../models/Stock.js';
import { tenantAuth, requireSuperAdmin } from '../middleware/tenantAuth.js';
import { sendEmail, generateOTP, sendEmailWithAttachment } from '../services/emailService.js';

const router = express.Router();

router.use(tenantAuth);

const getResourceUsage = () => {
  const memory = process.memoryUsage();
  return {
    uptimeSeconds: Math.round(process.uptime()),
    memory: {
      rssMb: Math.round(memory.rss / 1024 / 1024),
      heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(memory.heapTotal / 1024 / 1024),
      heapUsagePercent: memory.heapTotal ? Math.round((memory.heapUsed / memory.heapTotal) * 100) : 0
    }
  };
};

const calcSecurityScore = ({ tenant, failedLogins = 0, blocks = 0 }) => {
  let score = 100;
  if (tenant.status === 'suspended' || tenant.status === 'inactive') score -= 25;
  if (tenant.metadata?.lockdownMode) score -= 20;
  score -= Math.min(failedLogins * 4, 24);
  score -= Math.min(blocks * 3, 12);

  const limits = tenant.settings?.features || {};
  const usage = tenant.usage || {};
  const utilization = [
    ((usage.totalUsers || 0) / Math.max(limits.maxUsers || 100, 1)) * 100,
    ((usage.totalClients || 0) / Math.max(limits.maxClients || 1000, 1)) * 100,
    ((usage.totalDeals || 0) / Math.max(limits.maxDeals || 500, 1)) * 100
  ];
  if (utilization.some(value => value >= 95)) score -= 10;
  if (utilization.some(value => value >= 85)) score -= 5;

  return Math.max(0, Math.min(100, Math.round(score)));
};

const getTenantImpact = async (tenantId) => {
  const [users, clients, deals, salesAgg] = await Promise.all([
    User.countDocuments({ tenant: tenantId }),
    Client.countDocuments({ tenant: tenantId }),
    Deal.countDocuments({ tenant: tenantId }),
    Sale.aggregate([
      { $match: { tenant: tenantId, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, sales: { $sum: 1 }, revenue: { $sum: { $ifNull: ['$finalAmount', 0] } } } }
    ])
  ]);

  return {
    users,
    clients,
    deals,
    sales: salesAgg[0]?.sales || 0,
    revenue: salesAgg[0]?.revenue || 0
  };
};

// GET all tenants (super admin only)
router.get('/', requireSuperAdmin, async (req, res) => {
  try {
    const tenants = await Tenant.find({}).sort({ createdAt: -1 });
    res.json({ tenants, total: tenants.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET global command center overview (super admin only)
router.get('/command-center/overview', requireSuperAdmin, async (req, res) => {
  try {
    const startedAt = Date.now();
    const tenants = await Tenant.find({})
      .populate('subscription', 'planName planDisplayName pricing status billing features')
      .sort({ createdAt: -1 })
      .lean();

    const revenueByTenant = await Sale.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: '$tenant',
          revenue: { $sum: { $ifNull: ['$finalAmount', 0] } },
          sales: { $sum: 1 },
          cashRevenue: {
            $sum: {
              $cond: [{ $eq: ['$paymentMethod', 'cash'] }, { $ifNull: ['$finalAmount', 0] }, 0]
            }
          },
          creditRevenue: {
            $sum: {
              $cond: [{ $eq: ['$paymentMethod', 'credit'] }, { $ifNull: ['$finalAmount', 0] }, 0]
            }
          },
          pendingCredits: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$paymentMethod', 'credit'] },
                    { $ne: ['$creditStatus', 'paid'] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [failedLoginAgg, blockAgg] = await Promise.all([
      AuditLog.aggregate([
        { $match: { action: 'LOGIN', status: 'failed', createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: '$tenant', count: { $sum: 1 } } }
      ]),
      SecurityBlock.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$tenant', count: { $sum: 1 } } }
      ])
    ]);

    const revenueMap = new Map(
      revenueByTenant
        .filter(item => item._id)
        .map(item => [String(item._id), item])
    );
    const failedLoginMap = new Map(failedLoginAgg.map(item => [String(item._id || 'global'), item.count]));
    const blockMap = new Map(blockAgg.map(item => [String(item._id || 'global'), item.count]));

    const planMrr = (subscription) => {
      const amount = subscription?.pricing?.amount || 0;
      const interval = subscription?.pricing?.interval;
      if (interval === 'monthly') return amount;
      if (interval === 'yearly') return amount / 12;
      return 0;
    };

    const companies = tenants.map((tenant) => {
      const revenue = revenueMap.get(String(tenant._id)) || {};
      const limits = tenant.settings?.features || {};
      const usage = tenant.usage || {};
      const userLimit = limits.maxUsers || 100;
      const clientLimit = limits.maxClients || 1000;
      const dealLimit = limits.maxDeals || 500;
      const failedLogins = failedLoginMap.get(String(tenant._id)) || 0;
      const securityBlocks = (blockMap.get(String(tenant._id)) || 0) + (blockMap.get('global') || 0);

      return {
        id: tenant._id,
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        slug: tenant.slug,
        status: tenant.status,
        createdAt: tenant.createdAt,
        lastActivity: usage.lastActivity,
        subscription: tenant.subscription || null,
        settings: tenant.settings || {},
        mrr: planMrr(tenant.subscription),
        usage: {
          users: usage.totalUsers || 0,
          clients: usage.totalClients || 0,
          deals: usage.totalDeals || 0,
          storageUsed: usage.storageUsed || 0
        },
        limits: {
          users: userLimit,
          clients: clientLimit,
          deals: dealLimit
        },
        utilization: {
          users: Math.round(((usage.totalUsers || 0) / userLimit) * 100),
          clients: Math.round(((usage.totalClients || 0) / clientLimit) * 100),
          deals: Math.round(((usage.totalDeals || 0) / dealLimit) * 100)
        },
        security: {
          score: calcSecurityScore({ tenant, failedLogins, blocks: securityBlocks }),
          failedLogins,
          activeBlocks: securityBlocks,
          lockdownMode: Boolean(tenant.metadata?.lockdownMode),
          scheduledDeactivationAt: tenant.metadata?.scheduledDeactivationAt || null
        },
        sales: {
          count: revenue.sales || 0,
          revenue: revenue.revenue || 0,
          cashRevenue: revenue.cashRevenue || 0,
          creditRevenue: revenue.creditRevenue || 0,
          pendingCredits: revenue.pendingCredits || 0
        }
      };
    });

    const totals = companies.reduce((acc, company) => ({
      tenants: acc.tenants + 1,
      activeTenants: acc.activeTenants + (company.status === 'active' ? 1 : 0),
      trialTenants: acc.trialTenants + (company.status === 'trial' ? 1 : 0),
      suspendedTenants: acc.suspendedTenants + (company.status === 'suspended' ? 1 : 0),
      users: acc.users + company.usage.users,
      clients: acc.clients + company.usage.clients,
      deals: acc.deals + company.usage.deals,
      revenue: acc.revenue + company.sales.revenue,
      mrr: acc.mrr + company.mrr,
      sales: acc.sales + company.sales.count,
      pendingCredits: acc.pendingCredits + company.sales.pendingCredits
    }), {
      tenants: 0,
      activeTenants: 0,
      trialTenants: 0,
      suspendedTenants: 0,
      users: 0,
      clients: 0,
      deals: 0,
      revenue: 0,
      mrr: 0,
      sales: 0,
      pendingCredits: 0
    });

    const alerts = companies.flatMap((company) => {
      const companyAlerts = [];
      if (company.status === 'suspended') {
        companyAlerts.push({
          severity: 'critical',
          companyId: company.id,
          companyName: company.name,
          title: 'Organization suspended',
          detail: 'Access is currently blocked for this organization.'
        });
      }
      if (company.utilization.users >= 90 || company.utilization.clients >= 90 || company.utilization.deals >= 90) {
        companyAlerts.push({
          severity: 'warning',
          companyId: company.id,
          companyName: company.name,
          title: 'Usage limit pressure',
          detail: 'One or more usage limits are above 90%.'
        });
      }
      if (company.sales.pendingCredits > 0) {
        companyAlerts.push({
          severity: 'info',
          companyId: company.id,
          companyName: company.name,
          title: 'Pending credit sales',
          detail: `${company.sales.pendingCredits} credit sale${company.sales.pendingCredits === 1 ? '' : 's'} need follow-up.`
        });
      }
      return companyAlerts;
    }).slice(0, 12);

    res.json({
      generatedAt: new Date(),
      totals,
      companies,
      alerts,
      system: {
        apiLatencyMs: Date.now() - startedAt,
        dbState: 'connected',
        blockedPolicies: await SecurityBlock.countDocuments({ isActive: true }),
        ...getResourceUsage()
      }
    });
  } catch (error) {
    console.error('Error fetching command center overview:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/activity/live', requireSuperAdmin, async (req, res) => {
  try {
    const { tenantId, action, status, search, limit = 100 } = req.query;
    const query = {};
    if (tenantId) query.tenant = tenantId;
    if (action) query.action = action;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
        { ipAddress: { $regex: search, $options: 'i' } }
      ];
    }

    const logs = await AuditLog.find(query)
      .populate('tenant', 'name slug status')
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit), 250))
      .lean();

    res.json({ logs });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/login-forensics', requireSuperAdmin, async (req, res) => {
  try {
    const { tenantId, status, search, limit = 100 } = req.query;
    const query = { action: 'LOGIN' };
    if (tenantId) query.tenant = tenantId;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
        { ipAddress: { $regex: search, $options: 'i' } },
        { 'metadata.browser': { $regex: search, $options: 'i' } },
        { 'metadata.device': { $regex: search, $options: 'i' } }
      ];
    }

    const [logins, blocks] = await Promise.all([
      AuditLog.find(query)
        .populate('tenant', 'name slug status')
        .sort({ createdAt: -1 })
        .limit(Math.min(parseInt(limit), 250))
        .lean(),
      SecurityBlock.find({ isActive: true }).populate('tenant', 'name').sort({ createdAt: -1 }).lean()
    ]);

    const failedByIp = new Map();
    logins.forEach((login) => {
      if (login.status === 'failed' && login.ipAddress) {
        failedByIp.set(login.ipAddress, (failedByIp.get(login.ipAddress) || 0) + 1);
      }
    });

    const enriched = logins.map((login) => ({
      ...login,
      location: login.metadata?.location || 'Not recorded',
      suspicious: Boolean(login.status === 'failed' || (login.ipAddress && failedByIp.get(login.ipAddress) >= 3)),
      suspiciousReason: login.status === 'failed'
        ? login.metadata?.reason || 'Failed login'
        : login.ipAddress && failedByIp.get(login.ipAddress) >= 3
          ? 'Multiple failed attempts from this IP'
          : ''
    }));

    res.json({ logins: enriched, blocks });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/security-blocks', requireSuperAdmin, async (req, res) => {
  try {
    const { type, value, tenantId = null, reason = '' } = req.body;
    if (!['ip', 'device'].includes(type) || !value) {
      return res.status(400).json({ message: 'Type and value are required' });
    }

    const block = await SecurityBlock.findOneAndUpdate(
      { type, value, tenant: tenantId || null },
      { reason, createdBy: req.user.userId, isActive: true },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await AuditLog.create({
      action: 'OTHER',
      description: `Blocked ${type}: ${value}`,
      user: req.user.userId,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      tenant: tenantId || null,
      status: 'success',
      metadata: { type, value, reason }
    });

    res.status(201).json({ block });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'Block already exists' });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.patch('/security-blocks/:id', requireSuperAdmin, async (req, res) => {
  try {
    const block = await SecurityBlock.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive !== false },
      { new: true }
    );
    if (!block) return res.status(404).json({ message: 'Block not found' });
    res.json({ block });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id/profile', requireSuperAdmin, async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id).populate('subscription').lean();
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    const [impact, users, timeline, failedLogins, blocks] = await Promise.all([
      getTenantImpact(tenant._id),
      User.find({ tenant: tenant._id }).select('-password -otp').sort({ createdAt: -1 }).lean(),
      AuditLog.find({ tenant: tenant._id }).sort({ createdAt: -1 }).limit(30).lean(),
      AuditLog.countDocuments({ tenant: tenant._id, action: 'LOGIN', status: 'failed', createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
      SecurityBlock.countDocuments({ $or: [{ tenant: tenant._id }, { tenant: null }], isActive: true })
    ]);

    res.json({
      tenant,
      users,
      timeline,
      impact,
      securityScore: calcSecurityScore({ tenant, failedLogins, blocks }),
      failedLogins,
      activeBlocks: blocks
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id/impact', requireSuperAdmin, async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id).lean();
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    res.json({ tenant: { id: tenant._id, name: tenant.name, status: tenant.status }, impact: await getTenantImpact(tenant._id) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.patch('/:id/control', requireSuperAdmin, async (req, res) => {
  try {
    const { action, scheduledAt, reason = '' } = req.body;
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    const before = tenant.toObject();
    if (action === 'suspend') tenant.status = 'suspended';
    else if (action === 'reactivate') {
      tenant.status = 'active';
      tenant.metadata = { ...(tenant.metadata || {}), lockdownMode: false, scheduledDeactivationAt: null };
    } else if (action === 'deactivate') tenant.status = 'inactive';
    else if (action === 'lockdown') {
      tenant.status = 'suspended';
      tenant.metadata = { ...(tenant.metadata || {}), lockdownMode: true };
    } else if (action === 'schedule_deactivation') {
      if (!scheduledAt) return res.status(400).json({ message: 'scheduledAt is required' });
      tenant.metadata = { ...(tenant.metadata || {}), scheduledDeactivationAt: new Date(scheduledAt), scheduledDeactivationReason: reason };
    } else {
      return res.status(400).json({ message: 'Invalid control action' });
    }

    await tenant.save();
    const impact = await getTenantImpact(tenant._id);

    await AuditLog.create({
      action: action === 'suspend' || action === 'lockdown' ? 'SUSPEND_TENANT' : 'UPDATE_TENANT',
      description: `${action.replace(/_/g, ' ')} executed for ${tenant.name}`,
      user: req.user.userId,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      tenant: tenant._id,
      entityType: 'Tenant',
      entityId: tenant._id,
      status: 'success',
      metadata: { reason, before: { status: before.status, metadata: before.metadata }, after: { status: tenant.status, metadata: tenant.metadata }, impact }
    });

    res.json({ tenant, impact });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.patch('/:id/features', requireSuperAdmin, async (req, res) => {
  try {
    const { features = {} } = req.body;
    const update = {};
    Object.keys(features).forEach((key) => {
      update[`settings.features.${key}`] = features[key];
    });
    const before = await Tenant.findById(req.params.id).lean();
    const tenant = await Tenant.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    await AuditLog.create({
      action: 'UPDATE_TENANT',
      description: `Feature flags updated for ${tenant.name}`,
      user: req.user.userId,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      tenant: tenant._id,
      entityType: 'Tenant',
      entityId: tenant._id,
      status: 'success',
      metadata: { before: before?.settings?.features || {}, after: tenant.settings?.features || {} }
    });

    res.json({ tenant });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.patch('/:id/subscription', requireSuperAdmin, async (req, res) => {
  try {
    const { planName } = req.body;
    const subscription = await Subscription.findOne({ planName });
    if (!subscription) return res.status(404).json({ message: 'Subscription plan not found' });
    const tenant = await Tenant.findByIdAndUpdate(req.params.id, { subscription: subscription._id }, { new: true }).populate('subscription');
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    res.json({ tenant });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:id/impersonate-admin', requireSuperAdmin, async (req, res) => {
  try {
    const admin = await User.findOne({ tenant: req.params.id, role: 'admin', isActive: true }).populate('tenant');
    if (!admin) return res.status(404).json({ message: 'Active tenant admin not found' });

    const token = jwt.sign(
      { userId: admin._id, role: admin.role, tenantId: admin.tenant?._id, impersonatedBy: req.user.userId },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '30m' }
    );

    await AuditLog.create({
      action: 'OTHER',
      description: `${req.user.name} generated impersonation token for ${admin.email}`,
      user: req.user.userId,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      tenant: admin.tenant?._id || null,
      status: 'success',
      metadata: { impersonatedUser: admin._id, expiresIn: '30m' }
    });

    res.json({
      token,
      expiresIn: '30m',
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        tenant: admin.tenant ? { id: admin.tenant._id, name: admin.tenant.name, slug: admin.tenant.slug } : null
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/communications/announce', requireSuperAdmin, async (req, res) => {
  try {
    const { subject, message, tenantIds = [], channels = ['in_app'] } = req.body;
    if (!subject || !message) return res.status(400).json({ message: 'Subject and message are required' });

    const tenantQuery = tenantIds.length ? { _id: { $in: tenantIds } } : {};
    const tenants = await Tenant.find(tenantQuery).lean();
    const users = await User.find({ tenant: { $in: tenants.map(t => t._id) }, isActive: true }).lean();

    let notificationsCreated = 0;
    if (channels.includes('in_app')) {
      const docs = users.map((recipient) => ({
        title: subject,
        message,
        type: 'announcement',
        recipient: recipient._id,
        tenant: recipient.tenant,
        actor: req.user.userId,
        entityType: 'System',
        entityId: recipient.tenant,
        priority: 'medium'
      }));
      if (docs.length) {
        const created = await Notification.insertMany(docs);
        notificationsCreated = created.length;
      }
    }

    let emailsSent = 0;
    if (channels.includes('email')) {
      for (const recipient of users) {
        const result = await sendEmailWithAttachment(
          recipient.email,
          subject,
          `<p>${String(message).replace(/\n/g, '<br/>')}</p>`
        );
        if (result.success) emailsSent += 1;
      }
    }

    await AuditLog.create({
      action: 'OTHER',
      description: `Announcement sent: ${subject}`,
      user: req.user.userId,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      tenant: null,
      status: 'success',
      metadata: { tenantCount: tenants.length, userCount: users.length, channels, notificationsCreated, emailsSent }
    });

    res.json({ tenantsTargeted: tenants.length, usersTargeted: users.length, notificationsCreated, emailsSent });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH branding/logo - MUST be before /:id routes
router.patch('/branding/logo', async (req, res) => {
  try {
    if (req.isSuperAdmin) {
      return res.status(400).json({ message: 'Super admin does not have a tenant to update' });
    }
    const { logo, primaryColor, secondaryColor, customDomain, currency } = req.body;
    const update = {};
    if (logo) update['settings.logo'] = logo;
    if (primaryColor) update['settings.primaryColor'] = primaryColor;
    if (secondaryColor) update['settings.secondaryColor'] = secondaryColor;
    if (customDomain !== undefined) update['settings.customDomain'] = customDomain.trim().toLowerCase();
    if (currency) update['settings.currency'] = currency;

    const tenant = await Tenant.findByIdAndUpdate(req.tenantId, update, { new: true });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    res.json({ message: 'Branding updated successfully', tenant });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST create new tenant (super admin only)
router.post('/', requireSuperAdmin, async (req, res) => {
  try {
    const { name, email, phone, address, adminName, subscriptionPlan = 'starter', settings, metadata } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const existing = await Tenant.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Organization with this email already exists' });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'A user with this email already exists' });

    const subscription = await Subscription.findOne({ planName: subscriptionPlan }) ||
      await Subscription.findOne({ planName: 'starter' });

    const tenant = new Tenant({
      name,
      email,
      phone: phone || '',
      address: address || {},
      subscription: subscription?._id || null,
      settings: {
        primaryColor: settings?.primaryColor || '#f97316',
        secondaryColor: settings?.secondaryColor || '#1f2937',
        timezone: settings?.timezone || 'UTC',
        currency: settings?.currency || 'USD',
        language: settings?.language || 'en',
        features: {
          maxUsers: 100,
          maxClients: 1000,
          maxDeals: 500,
          advancedReports: true,
          apiAccess: true,
          customBranding: true,
          bulkOperations: true
        }
      },
      usage: { totalUsers: 0, totalClients: 0, totalDeals: 0, storageUsed: 0 },
      status: 'active',
      metadata: metadata || {}
    });
    await tenant.save();

    const otp = generateOTP();
    const companyAdminName = adminName || `${name} Admin`;

    const adminUser = new User({
      name: companyAdminName,
      email,
      password: otp, // Pass plain OTP; User model pre-save will hash it
      role: 'admin',
      tenant: tenant._id,
      otp, // Also store plain OTP for first-login OTP verification
      otpExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isFirstLogin: true,
      isActive: true,
      phone: phone || '',
      status: 'offline'
    });
    await adminUser.save();

    await Tenant.findByIdAndUpdate(tenant._id, { 'usage.totalUsers': 1 });

    const emailResult = await sendEmail(email, 'agentWelcome', {
      name: companyAdminName,
      email,
      otp
    });

    console.log('📧 Email sending result:', emailResult);

    const response = {
      message: 'Organization created successfully',
      tenant,
      admin: { name: companyAdminName, email, role: 'admin' },
      emailSent: emailResult.success
    };

    // If email failed, include OTP in response and log detailed error
    if (!emailResult.success) {
      console.error('❌ Failed to send welcome email:', emailResult.error);
      response.otp = otp;
      response.emailError = emailResult.error;
      response.message = 'Organization created but email failed to send';
    }

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating tenant:', error);
    if (error.code === 11000) return res.status(400).json({ message: 'Organization with this name or email already exists' });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH onboarding progress — admin saves wizard step data
router.patch('/onboarding', async (req, res) => {
  try {
    if (req.isSuperAdmin) {
      return res.status(400).json({ message: 'Super admin does not have an onboarding flow' });
    }

    const {
      step,          // 'branding' | 'localization' | 'team' | 'client' | 'complete'
      completed,     // boolean — did the user complete (not skip) this step?
      currentStep,   // numeric index of the current wizard step
      // Branding fields
      logo, primaryColor, secondaryColor,
      // Localization fields
      timezone, currency, language, dateFormat,
      // Company name update
      companyName
    } = req.body;

    const update = {};

    // Save step-specific data
    if (step === 'branding') {
      if (logo)           update['settings.logo']           = logo;
      if (primaryColor)   update['settings.primaryColor']   = primaryColor;
      if (secondaryColor) update['settings.secondaryColor'] = secondaryColor;
      if (companyName)    update.name                       = companyName;
      if (completed)      update['onboarding.stepsCompleted.branding'] = true;
    }

    if (step === 'localization') {
      if (timezone)   update['settings.timezone']   = timezone;
      if (currency)   update['settings.currency']   = currency;
      if (language)   update['settings.language']   = language;
      if (dateFormat) update['settings.dateFormat'] = dateFormat;
      if (completed)  update['onboarding.stepsCompleted.localization'] = true;
    }

    if (step === 'team' && completed) {
      update['onboarding.stepsCompleted.team'] = true;
    }

    if (step === 'client' && completed) {
      update['onboarding.stepsCompleted.client'] = true;
    }

    // Always track current step position
    if (typeof currentStep === 'number') {
      update['onboarding.currentStep'] = currentStep;
    }

    // Mark wizard as fully completed
    if (step === 'complete') {
      update['onboarding.completed']   = true;
      update['onboarding.completedAt'] = new Date();
    }

    const tenant = await Tenant.findByIdAndUpdate(
      req.tenantId,
      { $set: update },
      { new: true }
    );

    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    res.json({
      message: 'Onboarding progress saved',
      onboarding: tenant.onboarding,
      settings:   tenant.settings
    });
  } catch (error) {
    console.error('Error saving onboarding progress:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET onboarding status for current tenant
router.get('/onboarding', async (req, res) => {
  try {
    if (req.isSuperAdmin) {
      return res.json({ completed: true });
    }

    const tenant = await Tenant.findById(req.tenantId)
      .select('onboarding settings name');

    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    res.json({
      completed:      tenant.onboarding?.completed    ?? false,
      currentStep:    tenant.onboarding?.currentStep  ?? 0,
      stepsCompleted: tenant.onboarding?.stepsCompleted ?? {},
      settings:       tenant.settings,
      name:           tenant.name
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET single tenant (super admin only)
router.get('/:id', requireSuperAdmin, async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    const userCount = await User.countDocuments({ tenant: tenant._id });
    res.json({ ...tenant.toObject(), userCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT update tenant (super admin only)
router.put('/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { name, email, phone, address, status, settings, metadata } = req.body;
    const update = {};
    if (name) update.name = name;
    if (email) update.email = email;
    if (phone) update.phone = phone;
    if (address) update.address = address;
    if (status) update.status = status;
    if (metadata) update.metadata = metadata;
    if (settings) {
      if (settings.primaryColor) update['settings.primaryColor'] = settings.primaryColor;
      if (settings.secondaryColor) update['settings.secondaryColor'] = settings.secondaryColor;
      if (settings.timezone) update['settings.timezone'] = settings.timezone;
      if (settings.currency) update['settings.currency'] = settings.currency;
      if (settings.language) update['settings.language'] = settings.language;
      if (settings.features) {
        Object.keys(settings.features).forEach(key => {
          update[`settings.features.${key}`] = settings.features[key];
        });
      }
    }
    const tenant = await Tenant.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    res.json({ message: 'Organization updated successfully', tenant });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH update tenant status (super admin only)
router.patch('/:id/status', requireSuperAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended', 'inactive', 'trial'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const tenant = await Tenant.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    res.json({ message: `Organization ${status} successfully`, tenant });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE tenant (super admin only)
router.delete('/:id', requireSuperAdmin, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const tenantId = req.params.id;
    const tenant = await Tenant.findById(tenantId).session(session);
    if (!tenant) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Delete all related data in proper order to respect references
    // First, delete non-critical reference-breaking records
    await AuditLog.deleteMany({ tenant: tenantId }).session(session);
    await Notification.deleteMany({ tenant: tenantId }).session(session);
    await SecurityBlock.deleteMany({ tenant: tenantId }).session(session);
    await Performance.deleteMany({ tenant: tenantId }).session(session);
    await Meeting.deleteMany({ tenant: tenantId }).session(session);
    await Schedule.deleteMany({ tenant: tenantId }).session(session);

    // Delete Deal records (references Client, User)
    const deals = await Deal.find({ tenant: tenantId }).session(session);
    const dealIds = deals.map(d => d._id);
    await Deal.deleteMany({ tenant: tenantId }).session(session);

    // Delete Sale records (references Client, User)
    await Sale.deleteMany({ tenant: tenantId }).session(session);

    // Delete Client records (references User)
    await Client.deleteMany({ tenant: tenantId }).session(session);

    // Delete Stock records (references User)
    await Stock.deleteMany({ tenant: tenantId }).session(session);

    // Delete all User records for this tenant - this frees up unique emails for reuse
    await User.deleteMany({ tenant: tenantId }).session(session);

    // Finally, delete the tenant itself
    await Tenant.findByIdAndDelete(tenantId).session(session);

    await session.commitTransaction();
    session.endSession();

    res.json({ message: 'Organization and all associated data deleted successfully' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error deleting tenant:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET tenant stats (super admin only)
router.get('/:id/stats', requireSuperAdmin, async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    const [userCount, clientCount, dealCount] = await Promise.all([
      User.countDocuments({ tenant: tenant._id }),
      Client.countDocuments({ tenant: tenant._id }),
      Deal.countDocuments({ tenant: tenant._id })
    ]);
    res.json({
      tenantId: tenant._id,
      name: tenant.name,
      status: tenant.status,
      usage: { users: userCount, clients: clientCount, deals: dealCount },
      limits: tenant.settings.features,
      createdAt: tenant.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export { router as tenantRoutes };
