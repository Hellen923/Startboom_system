import express from 'express';
import ScheduledExport from '../models/ScheduledExport.js';
import { tenantAuth, requireRole } from '../middleware/tenantAuth.js';
import { buildExportData, nextRunFromFrequency } from '../utils/exportBuilders.js';
import { sendEmailWithAttachment } from '../services/emailService.js';
import { logAction } from '../utils/auditLog.js';

const router = express.Router();

router.use(tenantAuth);
router.use(requireRole(['admin', 'manager', 'superadmin']));

const parseRecipients = (recipients) => {
  if (Array.isArray(recipients)) return recipients.map(r => String(r).trim()).filter(Boolean);
  return String(recipients || '').split(',').map(r => r.trim()).filter(Boolean);
};

router.get('/', async (req, res) => {
  try {
    const query = req.isSuperAdmin ? {} : { tenant: req.tenantId };
    const exports = await ScheduledExport.find(query).sort({ createdAt: -1 }).lean();
    res.json({ exports });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ message: 'Scheduled exports require a tenant' });
    }

    const {
      name,
      exportType = 'clients',
      format = 'csv',
      frequency = 'weekly',
      recipients,
      filters = {},
      isActive = true
    } = req.body;

    const recipientList = parseRecipients(recipients);
    if (!name || recipientList.length === 0) {
      return res.status(400).json({ message: 'Name and at least one recipient are required' });
    }
    if (format === 'pdf' && exportType !== 'clients') {
      return res.status(400).json({ message: 'PDF scheduled exports are currently available for clients only' });
    }

    const scheduledExport = await ScheduledExport.create({
      tenant: req.tenantId,
      name,
      exportType,
      format,
      frequency,
      recipients: recipientList,
      filters,
      isActive,
      nextRunAt: nextRunFromFrequency(frequency, new Date()),
      createdBy: req.user.userId
    });

    await logAction(req, 'EXPORT_DATA', `Scheduled ${exportType} ${format.toUpperCase()} export ${name}`, {
      entityType: 'ScheduledExport',
      entityId: scheduledExport._id
    });

    res.status(201).json({ export: scheduledExport });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const query = req.isSuperAdmin ? { _id: req.params.id } : { _id: req.params.id, tenant: req.tenantId };
    const existingExport = await ScheduledExport.findOne(query);
    if (!existingExport) return res.status(404).json({ message: 'Scheduled export not found' });

    const update = {};
    ['name', 'exportType', 'format', 'frequency', 'filters', 'isActive'].forEach(key => {
      if (typeof req.body[key] !== 'undefined') update[key] = req.body[key];
    });
    if (typeof req.body.recipients !== 'undefined') update.recipients = parseRecipients(req.body.recipients);
    if (req.body.frequency) update.nextRunAt = nextRunFromFrequency(req.body.frequency, new Date());

    const nextExportType = update.exportType || existingExport.exportType;
    const nextFormat = update.format || existingExport.format;
    if (nextFormat === 'pdf' && nextExportType !== 'clients') {
      return res.status(400).json({ message: 'PDF scheduled exports are currently available for clients only' });
    }

    const scheduledExport = await ScheduledExport.findOneAndUpdate(query, update, { new: true, runValidators: true });

    res.json({ export: scheduledExport });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:id/run-now', async (req, res) => {
  try {
    const query = req.isSuperAdmin ? { _id: req.params.id } : { _id: req.params.id, tenant: req.tenantId };
    const scheduledExport = await ScheduledExport.findOne(query);
    if (!scheduledExport) return res.status(404).json({ message: 'Scheduled export not found' });

    const attachment = await buildExportData({
      tenantId: scheduledExport.tenant,
      exportType: scheduledExport.exportType,
      format: scheduledExport.format,
      filters: scheduledExport.filters
    });

    const result = await sendEmailWithAttachment(
      scheduledExport.recipients.join(','),
      `CRM ${scheduledExport.exportType} export: ${scheduledExport.name}`,
      `<p>Your scheduled CRM export is attached.</p><p>Records: ${attachment.count}</p>`,
      [{ filename: attachment.filename, content: attachment.content, contentType: attachment.contentType }]
    );

    scheduledExport.lastRunAt = new Date();
    scheduledExport.lastStatus = result.success ? 'success' : 'failed';
    scheduledExport.lastError = result.success ? '' : result.error;
    scheduledExport.nextRunAt = nextRunFromFrequency(scheduledExport.frequency, new Date());
    await scheduledExport.save();

    if (!result.success) {
      return res.status(500).json({ message: 'Export generated but email failed', error: result.error });
    }

    await logAction(req, 'EXPORT_DATA', `Ran scheduled export ${scheduledExport.name}`, {
      entityType: 'ScheduledExport',
      entityId: scheduledExport._id,
      metadata: { count: attachment.count, format: scheduledExport.format, type: scheduledExport.exportType }
    });

    res.json({ message: 'Scheduled export sent successfully', export: scheduledExport });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const query = req.isSuperAdmin ? { _id: req.params.id } : { _id: req.params.id, tenant: req.tenantId };
    const scheduledExport = await ScheduledExport.findOneAndDelete(query);
    if (!scheduledExport) return res.status(404).json({ message: 'Scheduled export not found' });
    res.json({ message: 'Scheduled export deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export { router as scheduledExportRoutes };
