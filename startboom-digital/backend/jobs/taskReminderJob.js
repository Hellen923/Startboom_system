/**
 * Task Reminder Cron Job
 *
 * Runs every hour and checks for client tasks that are:
 *   - Due within the next 24 hours  → sends a "due soon" reminder
 *   - Past their due date           → sends an "overdue" reminder
 *
 * Uses `reminderSent` and `overdueSent` flags on each task to ensure
 * each reminder is sent exactly once, preventing notification spam.
 *
 * Tenant-aware: only processes clients belonging to active tenants.
 */

import cron from 'node-cron';
import Client from '../models/Client.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Tenant from '../models/Tenant.js';
import { sendEmail } from '../services/emailService.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Send an in-app notification to the assigned agent (and their admin).
 */
const sendTaskNotification = async ({ type, agent, client, task, tenant }) => {
  try {
    // Notify the assigned agent directly
    const recipients = [agent._id];

    // Also notify the tenant admin(s)
    const admins = await User.find({ role: 'admin', tenant: tenant._id, isActive: true })
      .select('_id')
      .lean();
    admins.forEach(a => {
      if (String(a._id) !== String(agent._id)) recipients.push(a._id);
    });

    const isOverdue = type === 'task_overdue';
    const title   = isOverdue
      ? `Overdue Task: "${task.title}"`
      : `Task Due Soon: "${task.title}"`;
    const message = isOverdue
      ? `Task "${task.title}" for client ${client.name} is overdue. Due: ${new Date(task.dueDate).toLocaleDateString()}`
      : `Task "${task.title}" for client ${client.name} is due within 24 hours. Due: ${new Date(task.dueDate).toLocaleString()}`;

    const notifications = recipients.map(recipientId => ({
      title,
      message,
      type,
      recipient: recipientId,
      actor: agent._id,
      entityType: 'client',
      entityId: client._id,
      tenant: tenant._id,
      priority: isOverdue ? 'high' : 'medium',
      metadata: {
        taskTitle:  task.title,
        clientName: client.name,
        dueDate:    task.dueDate,
        taskId:     task._id
      }
    }));

    await Notification.insertMany(notifications);
  } catch (err) {
    console.error('[TaskReminder] Notification error:', err.message);
  }
};

/**
 * Send a reminder email to the assigned agent.
 */
const sendTaskEmail = async ({ agent, client, task, isOverdue }) => {
  try {
    if (!agent.email) return;

    await sendEmail(agent.email, 'taskReminder', {
      agentName:       agent.name,
      clientName:      client.name,
      taskTitle:       task.title,
      taskDescription: task.description || '',
      dueDate:         task.dueDate,
      isOverdue,
      appUrl: process.env.APP_URL || 'https://crm-dbs.vercel.app'
    });
  } catch (err) {
    console.error('[TaskReminder] Email error:', err.message);
  }
};

// ─── Core job logic ───────────────────────────────────────────────────────────

export const runTaskReminderJob = async () => {
  try {
    const now        = new Date();
    const in24Hours  = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Only process active / trial tenants
    const activeTenants = await Tenant.find({
      status: { $in: ['active', 'trial'] }
    }).select('_id').lean();

    if (activeTenants.length === 0) return;

    const tenantIds = activeTenants.map(t => t._id);

    // Find all clients that have at least one incomplete task with a dueDate
    const clients = await Client.find({
      tenant: { $in: tenantIds },
      'tasks.completed': false,
      'tasks.dueDate':   { $exists: true, $ne: null }
    })
      .populate('assignedTo', 'name email')   // top-level agent
      .populate('tasks.assignedTo', 'name email')
      .lean();

    let dueSoonCount = 0;
    let overdueCount = 0;

    for (const client of clients) {
      // We need to update flags — work with the Mongoose document
      const clientDoc = await Client.findById(client._id)
        .populate('tasks.assignedTo', 'name email');

      let modified = false;

      for (const task of clientDoc.tasks) {
        if (task.completed || !task.dueDate) continue;

        const dueDate = new Date(task.dueDate);

        // Resolve the agent responsible for this task
        const agentDoc = task.assignedTo || await User.findById(client.agent).lean();
        if (!agentDoc) continue;

        const tenant = activeTenants.find(
          t => String(t._id) === String(client.tenant)
        ) || { _id: client.tenant };

        // ── Overdue check ──────────────────────────────────────────────────
        if (dueDate < now && !task.overdueSent) {
          await sendTaskNotification({
            type: 'task_overdue', agent: agentDoc, client, task, tenant
          });
          await sendTaskEmail({ agent: agentDoc, client, task, isOverdue: true });

          task.overdueSent = true;
          modified = true;
          overdueCount++;
          continue; // Don't also send "due soon" for the same task
        }

        // ── Due-soon check (within next 24 hours) ─────────────────────────
        if (dueDate >= now && dueDate <= in24Hours && !task.reminderSent) {
          await sendTaskNotification({
            type: 'task_due', agent: agentDoc, client, task, tenant
          });
          await sendTaskEmail({ agent: agentDoc, client, task, isOverdue: false });

          task.reminderSent = true;
          modified = true;
          dueSoonCount++;
        }
      }

      if (modified) {
        await clientDoc.save();
      }
    }

    if (dueSoonCount > 0 || overdueCount > 0) {
      console.log(
        `[TaskReminder] Sent ${dueSoonCount} due-soon and ${overdueCount} overdue reminder(s) at ${now.toISOString()}`
      );
    }
  } catch (err) {
    console.error('[TaskReminder] Job failed:', err.message);
  }
};

// ─── Schedule ─────────────────────────────────────────────────────────────────

// Start the task reminder cron job.
// Runs at the top of every hour: "0 * * * *"
// In development set TASK_REMINDER_CRON env var to a faster schedule,
// e.g. every 5 minutes: "0-59/5 * * * *"
export const startTaskReminderJob = () => {
  const schedule = process.env.TASK_REMINDER_CRON || '0 * * * *';

  cron.schedule(schedule, () => {
    runTaskReminderJob();
  });

  console.log(`✅ Task reminder job scheduled (${schedule})`);
};
