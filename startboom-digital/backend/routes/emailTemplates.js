import express from 'express';
import EmailTemplate from '../models/EmailTemplate.js';
import { tenantAuth, requireRole } from '../middleware/tenantAuth.js';
import { logAction } from '../utils/auditLog.js';

const router = express.Router();

router.use(tenantAuth);

export const DEFAULT_EMAIL_TEMPLATES = [
  {
    _id: 'default-follow-up',
    name: 'Client Follow-up',
    category: 'client',
    subject: 'Following up on our conversation',
    body: 'Hello {{clientName}},\n\nThank you for your time. I wanted to follow up and see if you have any questions.\n\nBest regards,\n{{agentName}}',
    isDefault: true,
    isActive: true
  },
  {
    _id: 'default-welcome-client',
    name: 'Welcome Client',
    category: 'client',
    subject: 'Welcome to {{companyName}}',
    body: 'Hello {{clientName}},\n\nWelcome to {{companyName}}. We are excited to work with you.\n\nBest regards,\n{{agentName}}',
    isDefault: true,
    isActive: true
  },
  {
    _id: 'default-payment-reminder',
    name: 'Payment Reminder',
    category: 'client',
    subject: 'Payment reminder',
    body: 'Hello {{clientName}},\n\nThis is a friendly reminder about your pending payment. Please contact us if you need any assistance.\n\nBest regards,\n{{agentName}}',
    isDefault: true,
    isActive: true
  }
];

router.get('/', async (req, res) => {
  try {
    const query = req.isSuperAdmin ? {} : { tenant: req.tenantId };
    const templates = await EmailTemplate.find(query).sort({ updatedAt: -1 }).lean();
    res.json({ templates: [...DEFAULT_EMAIL_TEMPLATES, ...templates] });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/', requireRole(['admin', 'manager', 'superadmin']), async (req, res) => {
  try {
    const { name, category = 'client', subject, body, isActive = true } = req.body;
    if (!name || !subject || !body) {
      return res.status(400).json({ message: 'Name, subject and body are required' });
    }
    if (!req.tenantId && !req.isSuperAdmin) {
      return res.status(400).json({ message: 'Tenant context is required' });
    }

    const template = await EmailTemplate.create({
      tenant: req.tenantId || null,
      name,
      category,
      subject,
      body,
      isActive,
      createdBy: req.user.userId
    });

    await logAction(req, 'UPDATE_SETTINGS', `Created email template ${template.name}`, {
      entityType: 'EmailTemplate',
      entityId: template._id
    });

    res.status(201).json({ template });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'An email template with this name already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id', requireRole(['admin', 'manager', 'superadmin']), async (req, res) => {
  try {
    const query = req.isSuperAdmin ? { _id: req.params.id } : { _id: req.params.id, tenant: req.tenantId };
    const update = {};
    ['name', 'category', 'subject', 'body', 'isActive'].forEach(key => {
      if (typeof req.body[key] !== 'undefined') update[key] = req.body[key];
    });

    const template = await EmailTemplate.findOneAndUpdate(query, update, { new: true, runValidators: true });
    if (!template) return res.status(404).json({ message: 'Email template not found' });

    await logAction(req, 'UPDATE_SETTINGS', `Updated email template ${template.name}`, {
      entityType: 'EmailTemplate',
      entityId: template._id
    });

    res.json({ template });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:id', requireRole(['admin', 'manager', 'superadmin']), async (req, res) => {
  try {
    const query = req.isSuperAdmin ? { _id: req.params.id } : { _id: req.params.id, tenant: req.tenantId };
    const template = await EmailTemplate.findOneAndDelete(query);
    if (!template) return res.status(404).json({ message: 'Email template not found' });

    await logAction(req, 'UPDATE_SETTINGS', `Deleted email template ${template.name}`, {
      entityType: 'EmailTemplate',
      entityId: template._id
    });

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export { router as emailTemplateRoutes };
