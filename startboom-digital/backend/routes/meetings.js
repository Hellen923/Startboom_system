import express from 'express';
import Meeting from '../models/Meeting.js';
import mongoose from 'mongoose';
import { tenantAuth } from '../middleware/tenantAuth.js';

const router = express.Router();

// Apply tenant-aware middleware to all routes
router.use(tenantAuth);

// Get all meetings
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, agent, client, status } = req.query;
    
    const filter = { ...req.tenantQuery };
    if (agent) filter.agent = new mongoose.Types.ObjectId(agent);
    if (client) filter.client = new mongoose.Types.ObjectId(client);
    if (status) filter.status = status;
    if (req.user.role === 'agent') filter.agent = req.user.userId;
    
    const meetings = await Meeting.find(filter)
      .populate('agent', 'name email')
      .populate('client', 'name email phone')
      .sort({ scheduledTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Meeting.countDocuments(filter);
    
    res.json({
      meetings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ message: 'Error fetching meetings', error: error.message });
  }
});

// Get meetings by agent
router.get('/agent/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    
    const filter = { agent: new mongoose.Types.ObjectId(agentId), ...req.tenantQuery };
    if (status) filter.status = status;
    
    const meetings = await Meeting.find(filter)
      .populate('agent', 'name email')
      .populate('client', 'name email phone')
      .sort({ scheduledTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Meeting.countDocuments(filter);
    
    res.json({
      meetings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching agent meetings:', error);
    res.status(500).json({ message: 'Error fetching agent meetings', error: error.message });
  }
});

// Get single meeting
router.get('/:id', async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('agent', 'name email')
      .populate('client', 'name email phone company');
    
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    
    res.json(meeting);
  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({ message: 'Error fetching meeting', error: error.message });
  }
});

// Create new meeting
router.post('/', async (req, res) => {
  try {
    const meetingData = {
      ...req.body,
      tenant: req.user.tenantId,
      agent: req.body.agent || req.user.userId
    };
    
    // Auto-generate Google Meet link if location is Google Meet and no link provided
    if (meetingData.location === 'Google Meet' && !meetingData.googleMeetLink) {
      const meetCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      meetingData.googleMeetLink = `https://meet.google.com/${meetCode}`;
    }
    
    // Clear Google Meet link if location is In Person
    if (meetingData.location === 'In Person') {
      meetingData.googleMeetLink = undefined;
    }
    
    const meeting = new Meeting(meetingData);
    await meeting.save();
    
    // Populate references for response
    await meeting.populate('agent', 'name email');
    await meeting.populate('client', 'name email phone');
    
    res.status(201).json(meeting);
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ message: 'Error creating meeting', error: error.message });
  }
});

// Update meeting
router.put('/:id', async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Auto-generate Google Meet link if location is changed to Google Meet and no link provided
    if (updateData.location === 'Google Meet' && !updateData.googleMeetLink) {
      const meetCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      updateData.googleMeetLink = `https://meet.google.com/${meetCode}`;
    }
    
    // Clear Google Meet link if location is changed to In Person
    if (updateData.location === 'In Person') {
      updateData.googleMeetLink = undefined;
    }
    
    const meeting = await Meeting.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantQuery },
      updateData,
      { new: true, runValidators: true }
    ).populate('agent', 'name email')
     .populate('client', 'name email phone');
    
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    
    res.json(meeting);
  } catch (error) {
    console.error('Error updating meeting:', error);
    res.status(500).json({ message: 'Error updating meeting', error: error.message });
  }
});

// Delete meeting
router.delete('/:id', async (req, res) => {
  try {
    const meeting = await Meeting.findOneAndDelete({ _id: req.params.id, ...req.tenantQuery });
    
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    
    res.json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ message: 'Error deleting meeting', error: error.message });
  }
});

// Get upcoming meetings
router.get('/upcoming/list', async (req, res) => {
  try {
    const { agentId, limit = 5 } = req.query;
    
    const filter = {
      scheduledTime: { $gte: new Date() },
      status: 'scheduled',
      ...req.tenantQuery
    };
    
    if (agentId) {
      filter.agent = new mongoose.Types.ObjectId(agentId);
    } else if (req.user.role === 'agent') {
      filter.agent = req.user.userId;
    }
    
    const meetings = await Meeting.find(filter)
      .populate('agent', 'name email')
      .populate('client', 'name email phone')
      .sort({ scheduledTime: 1 })
      .limit(parseInt(limit));
    
    res.json(meetings);
  } catch (error) {
    console.error('Error fetching upcoming meetings:', error);
    res.status(500).json({ message: 'Error fetching upcoming meetings', error: error.message });
  }
});

export { router as meetingRoutes };
