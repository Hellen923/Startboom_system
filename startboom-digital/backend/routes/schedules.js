import express from 'express';
import Schedule from '../models/Schedule.js';
import { createNotification } from '../utils/notifications.js';
import { tenantAuth } from '../middleware/tenantAuth.js';

// Generate pseudo-realistic meeting link based on mode
const generateMeetingLink = (mode) => {
  const randomSegment = (length = 10) =>
    Math.random().toString(36).substring(2, 2 + length);

  switch (mode) {
    case 'zoom': {
      const meetingId = `${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      return `https://zoom.us/j/${meetingId}`;
    }
    case 'google-meet': {
      // pattern like xxx-yyyy-zzz
      const part1 = randomSegment(3);
      const part2 = randomSegment(4);
      const part3 = randomSegment(3);
      return `https://meet.google.com/${part1}-${part2}-${part3}`;
    }
    case 'teams': {
      const id = `${randomSegment(8)}-${randomSegment(4)}-${randomSegment(4)}-${randomSegment(4)}-${randomSegment(12)}`;
      return `https://teams.microsoft.com/l/meetup-join/${id}`;
    }
    default:
      return null;
  }
};

const router = express.Router();

// Apply tenant-aware middleware to all routes
router.use(tenantAuth);

// Get all schedules with filters
router.get('/', async (req, res) => {
  try {
    const { agentId, clientId, type, status, startDate, endDate, page = 1, limit = 10 } = req.query;

    let query = { ...req.tenantQuery };

    if (req.user.role === 'agent') {
      query.agent = req.user.userId;
    } else if (agentId) {
      query.agent = agentId;
    }
    if (clientId) query.client = clientId;
    if (type) query.type = type;
    if (status) query.status = status;

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const schedules = await Schedule.find(query)
      .populate('client', 'name email phone company')
      .populate('agent', 'name email role')
      .sort({ date: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Schedule.countDocuments(query);

    res.json({
      schedules,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get schedule by ID
router.get('/:id', async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id)
      .populate('client', 'name email phone company')
      .populate('agent', 'name email role');

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    res.json(schedule);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new schedule
router.post('/', async (req, res) => {
  try {
    const scheduleData = { ...req.body, tenant: req.user.tenantId };

    // Generate meeting link if it's a virtual meeting
    if (scheduleData.type === 'meeting' && ['zoom', 'google-meet', 'teams'].includes(scheduleData.mode)) {
      scheduleData.meetingLink = generateMeetingLink(scheduleData.mode);
    }

    const schedule = new Schedule(scheduleData);
    await schedule.save();

    await schedule.populate('client', 'name email phone company');
    await schedule.populate('agent', 'name email role');

    // Send email invite to client if it's a meeting
    if (schedule.type === 'meeting' && schedule.client && schedule.client.email) {
      const { sendEmail } = await import('../services/emailService.js');

      const emailResult = await sendEmail(
        schedule.client.email,
        'meetingInvite',
        {
          clientName: schedule.client.name,
          agentName: schedule.agent.name,
          title: schedule.title,
          date: schedule.date,
          duration: schedule.duration,
          location: schedule.location,
          mode: schedule.mode,
          agenda: schedule.agenda,
          meetingLink: schedule.meetingLink
        }
      );

      if (emailResult.success) {
      } else {
        console.error('❌ Failed to send meeting invite:', emailResult.error);
      }
    }

    // Create notification for admins when a meeting/schedule is created
    try {
      await createNotification({
        type: 'meeting_created',
        actorId: schedule.agent?._id || schedule.agent,
        entityType: 'meeting',
        entityId: schedule._id,
        metadata: {
          meetingTitle: schedule.title,
          date: schedule.date ? new Date(schedule.date).toLocaleDateString() : 'TBD',
          clientName: schedule.client?.name || 'Unknown Client',
          meetingType: schedule.type,
          mode: schedule.mode
        }
      });
    } catch (notifyError) {
      console.warn('Failed to create schedule notification:', notifyError.message);
    }

    // Send additional notification for reminders if scheduled
    if (schedule.reminders && schedule.reminders.length > 0) {
      try {
        const { sendNotification } = await import('../utils/notifications.js');
        await sendNotification(schedule, 'created');
      } catch (notifyError) {
        console.error('Error sending schedule reminder notification:', notifyError);
        // Do not fail schedule creation if notification fails
      }
    }

    res.status(201).json(schedule);
  } catch (error) {
    console.error('Error creating schedule:', error);

    // Surface validation errors clearly instead of generic 500
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors || {}).map((e) => e.message);
      return res.status(400).json({
        message: 'Validation failed',
        errors,
      });
    }

    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update schedule
router.put('/:id', async (req, res) => {
  try {
    const schedule = await Schedule.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantQuery },
      req.body,
      { new: true, runValidators: true }
    )
      .populate('client', 'name email phone company')
      .populate('agent', 'name email role');

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    res.json(schedule);
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete schedule
router.delete('/:id', async (req, res) => {
  try {
    const schedule = await Schedule.findOneAndDelete({ _id: req.params.id, ...req.tenantQuery });

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark as completed
router.patch('/:id/complete', async (req, res) => {
  try {
    const schedule = await Schedule.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantQuery },
      { status: 'completed' },
      { new: true }
    )
      .populate('client', 'name email phone company')
      .populate('agent', 'name email role');

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    res.json(schedule);
  } catch (error) {
    console.error('Error completing schedule:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reschedule meeting
router.patch('/:id/reschedule', async (req, res) => {
  try {
    const { date, duration, notes } = req.body;

    const schedule = await Schedule.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantQuery },
      {
        date,
        duration,
        status: 'scheduled',
        $push: {
          history: {
            action: 'rescheduled',
            date: new Date(),
            notes: notes || 'Meeting rescheduled'
          }
        }
      },
      { new: true }
    )
      .populate('client', 'name email phone company')
      .populate('agent', 'name email role');

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    res.json(schedule);
  } catch (error) {
    console.error('Error rescheduling:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get upcoming schedules
router.get('/agent/:agentId/upcoming', async (req, res) => {
  try {
    const { agentId } = req.params;
    const today = new Date();

    const upcomingSchedules = await Schedule.find({
      agent: agentId,
      date: { $gte: today },
      status: 'scheduled',
      ...req.tenantQuery
    })
      .populate('client', 'name email phone company')
      .sort({ date: 1 })
      .limit(10);

    res.json(upcomingSchedules);
  } catch (error) {
    console.error('Error fetching upcoming schedules:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Client response to meeting invite
router.post('/:id/respond', async (req, res) => {
  try {
    const { response, notes } = req.body; // response: 'accepted', 'declined', 'tentative'

    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    schedule.clientResponse = {
      responded: true,
      response,
      respondedAt: new Date(),
      notes
    };

    await schedule.save();

    // Create notification for the agent about client response
    const { createNotification } = await import('../utils/notifications.js');
    await createNotification({
      type: 'meeting_response',
      actorId: schedule.client._id,
      entityType: 'meeting',
      entityId: schedule._id,
      metadata: {
        response,
        meetingTitle: schedule.title,
        clientName: schedule.client?.name || 'Client'
      }
    });

    res.json({ message: 'Response recorded successfully', schedule });
  } catch (error) {
    console.error('Error recording response:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark meeting as completed and track attendance
router.put('/:id/complete', async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndUpdate(
      req.params.id,
      {
        status: 'completed',
        completedAt: new Date()
      },
      { new: true }
    ).populate('client', 'name email')
      .populate('agent', 'name email');

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Create notification for completed meeting
    const { createNotification } = await import('../utils/notifications.js');
    await createNotification({
      type: 'meeting_completed',
      actorId: schedule.agent._id,
      entityType: 'meeting',
      entityId: schedule._id,
      metadata: {
        meetingTitle: schedule.title,
        clientName: schedule.client?.name || 'Client'
      }
    });

    res.json(schedule);
  } catch (error) {
    console.error('Error completing meeting:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export { router as scheduleRoutes };