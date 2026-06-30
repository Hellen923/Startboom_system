import express from 'express';
import mongoose from 'mongoose';
import { body, validationResult } from 'express-validator';
import Issue from '../models/Issue.js';
import Client from '../models/Client.js';
import { tenantAuth } from '../middleware/tenantAuth.js';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

// All issue routes require tenant isolation and login
router.use(tenantAuth);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/issues  — list with optional filters
// Query: status, type, priority, client, search, fromDate, toDate, page, limit
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const tenantId = req.tenant?._id || req.tenantId;
    if (!tenantId) return res.status(400).json({ message: 'Tenant not identified' });

    const { status, type, priority, client, search, fromDate, toDate } = req.query;
    let page  = parseInt(req.query.page)  || 1;
    let limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const match = { tenant: new mongoose.Types.ObjectId(tenantId) };
    if (status)   match.status   = status;
    if (type)     match.type     = type;
    if (priority) match.priority = priority;
    if (client)   match.client   = new mongoose.Types.ObjectId(client);

    if (fromDate || toDate) {
      match.createdAt = {};
      if (fromDate) match.createdAt.$gte = new Date(fromDate);
      if (toDate)   match.createdAt.$lte = new Date(toDate);
    }

    const filter = { ...match };

    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
      ];
    }

    const [rows, total] = await Promise.all([
      Issue.find(filter)
        .populate('client',     'name email')
        .populate('createdBy',  'name email')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Issue.countDocuments(filter),
    ]);

    res.json({
      issues:    rows,
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/issues/:id  — single issue
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const tenantId = req.tenant?._id || req.tenantId;
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: 'Invalid issue ID' });

    const issue = await Issue.findOne({
      _id:     id,
      tenant:  new mongoose.Types.ObjectId(tenantId),
    })
      .populate('client',     'name email phone')
      .populate('createdBy',  'name email')
      .populate('assignedTo', 'name email');

    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    res.json(issue);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/issues  — create (contactPerson auto-copied from client)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/',
  [
    body('client').isMongoId().withMessage('Valid client ID is required'),
    body('type').isIn(['Bug', 'Complaint', 'Feature Request', 'Billing', 'Technical', 'General']),
    body('description').trim().isLength({ min: 5 }).withMessage('Description must be at least 5 characters'),
    body('priority').isIn(['Low', 'Medium', 'Critical']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ message: errors.array()[0].msg });

      const tenantId = req.tenant?._id || req.tenantId;
      const userId   = req.user?.userId || req.user?._id;
      const { client, contactPerson, type, description, priority, assignedTo } = req.body;

      const clientDoc = await Client.findOne({
        _id:  client,
        ...(req.tenantQuery || { tenant: new mongoose.Types.ObjectId(tenantId) }),
      });
      if (!clientDoc) return res.status(404).json({ message: 'Client not found' });

      const issue = await Issue.create({
        client, type, description,
        contactPerson: contactPerson || clientDoc.contactName || '',
        priority: priority || 'Medium',
        status: 'New',
        tenant: new mongoose.Types.ObjectId(tenantId),
        createdBy: userId,
        assignedTo: assignedTo || null,
      });

      await issue.populate('client',     'name email');
      await issue.populate('createdBy',  'name email');
      await issue.populate('assignedTo', 'name email');

      // Audit log — non-fatal
      try {
        await new AuditLog({
          action:      'issue_created',
          user:        userId,
          tenant:      new mongoose.Types.ObjectId(tenantId),
          description: `Issue "${type}" created for ${clientDoc.name}`,
        }).save();
      } catch { /* audit failure is non-fatal */ }

      res.status(201).json(issue);
    } catch (error) {
      if (error.name === 'ValidationError')
        return res.status(400).json({ message: error.message });
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/issues/:id  — full update
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id', async (req, res) => {
  try {
    const tenantId = req.tenant?._id || req.tenantId;
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: 'Invalid issue ID' });

    const issue = await Issue.findOneAndUpdate(
      { _id: id, tenant: new mongoose.Types.ObjectId(tenantId) },
      req.body,
      { new: true, runValidators: true },
    ).populate('client', 'name email');

    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    res.json(issue);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/issues/:id/status  — quick status change
// Body: { status: 'New' | 'In Progress' | 'Done', resolution?: string }
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/status', async (req, res) => {
  try {
    const tenantId = req.tenant?._id || req.tenantId;
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: 'Invalid issue ID' });

    const { status, resolution } = req.body;
    if (!['New', 'In Progress', 'Done'].includes(status))
      return res.status(400).json({ message: 'Invalid status. Use New, In Progress, or Done.' });

    const update = { status };
    if (status === 'Done' && resolution) update.resolution = resolution;

    const issue = await Issue.findOneAndUpdate(
      { _id: id, tenant: new mongoose.Types.ObjectId(tenantId) },
      update, { new: true, runValidators: true },
    ).populate('client', 'name email');

    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    res.json(issue);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/issues/:id
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const tenantId = req.tenant?._id || req.tenantId;
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: 'Invalid issue ID' });

     const issue = await Issue.findOneAndDelete({
       _id: id, tenant: new mongoose.Types.ObjectId(tenantId),
     });

    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    res.json({ message: 'Issue deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export const issueRoutes = router;
