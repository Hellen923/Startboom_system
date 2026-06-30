import express from 'express';
import AuditLog from '../models/AuditLog.js';
import { tenantAuth, requireRole } from '../middleware/tenantAuth.js';

const router = express.Router();

router.use(tenantAuth);

const auditRoles = ['admin', 'manager', 'superadmin'];

// Audit logs are immutable. Block all write methods at the HTTP layer.
const blockWrites = (req, res) => {
  res.status(405).json({
    message: 'Audit logs are immutable. Write operations are not permitted.',
    code: 'AUDIT_LOG_IMMUTABLE'
  });
};

router.post('/', blockWrites);
router.put('/', blockWrites);
router.put('/:id', blockWrites);
router.patch('/:id', blockWrites);
router.delete('/:id', blockWrites);

const buildAuditQuery = (req) => {
  const {
    action,
    userId,
    startDate,
    endDate,
    status,
    search
  } = req.query;

  const query = req.isSuperAdmin ? {} : { tenant: req.tenantId };

  if (action) query.action = action;
  if (userId) query.user = userId;
  if (status) query.status = status;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  if (search) {
    const regex = new RegExp(search, 'i');
    query.$or = [
      { description: regex },
      { userName: regex },
      { userEmail: regex }
    ];
  }

  return query;
};

router.get('/', requireRole(auditRoles), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const query = buildAuditQuery(req);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

const getAuditStats = async (req, res) => {
  try {
    const query = req.isSuperAdmin ? {} : { tenant: req.tenantId };

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentQuery = { ...query, createdAt: { $gte: thirtyDaysAgo } };

    const [total, recent, byAction, byStatus] = await Promise.all([
      AuditLog.countDocuments(query),
      AuditLog.countDocuments(recentQuery),
      AuditLog.aggregate([
        { $match: recentQuery },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      AuditLog.aggregate([
        { $match: recentQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    res.json({ total, recent, byAction, byStatus });
  } catch (error) {
    console.error('Error fetching audit log stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

router.get('/stats', requireRole(auditRoles), getAuditStats);
router.get('/stats/summary', requireRole(auditRoles), getAuditStats);

router.get('/:id', requireRole(auditRoles), async (req, res) => {
  try {
    const query = req.isSuperAdmin
      ? { _id: req.params.id }
      : { _id: req.params.id, tenant: req.tenantId };

    const log = await AuditLog.findOne(query).lean();

    if (!log) {
      return res.status(404).json({ message: 'Audit log entry not found' });
    }

    res.json(log);
  } catch (error) {
    console.error('Error fetching audit log entry:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export { router as auditLogRoutes };
