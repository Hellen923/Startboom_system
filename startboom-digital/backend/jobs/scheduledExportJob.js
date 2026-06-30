import cron from 'node-cron';
import ScheduledExport from '../models/ScheduledExport.js';
import { buildExportData, nextRunFromFrequency } from '../utils/exportBuilders.js';
import { sendEmailWithAttachment } from '../services/emailService.js';

export const runScheduledExportJob = async () => {
  const now = new Date();
  const dueExports = await ScheduledExport.find({
    isActive: true,
    nextRunAt: { $lte: now }
  }).limit(25);

  for (const scheduledExport of dueExports) {
    try {
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

      scheduledExport.lastRunAt = now;
      scheduledExport.lastStatus = result.success ? 'success' : 'failed';
      scheduledExport.lastError = result.success ? '' : result.error || 'Unknown email error';
      scheduledExport.nextRunAt = nextRunFromFrequency(scheduledExport.frequency, now);
      await scheduledExport.save();
    } catch (error) {
      scheduledExport.lastRunAt = now;
      scheduledExport.lastStatus = 'failed';
      scheduledExport.lastError = error.message;
      scheduledExport.nextRunAt = nextRunFromFrequency(scheduledExport.frequency, now);
      await scheduledExport.save();
    }
  }
};

export const startScheduledExportJob = () => {
  const schedule = process.env.SCHEDULED_EXPORT_CRON || '*/15 * * * *';
  cron.schedule(schedule, () => {
    runScheduledExportJob().catch(error => {
      console.error('[ScheduledExport] Job failed:', error.message);
    });
  });
  console.log(`Scheduled export job scheduled (${schedule})`);
};
