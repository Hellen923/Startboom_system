// routes/deals.js
import express from 'express';
import Deal from '../models/Deal.js';
import { body, validationResult } from 'express-validator';
import { createNotification } from '../utils/notifications.js';
import { tenantAuth } from '../middleware/tenantAuth.js';
import { logAction } from '../utils/auditLog.js';

const router = express.Router();

const DEAL_STAGES = ['lead', 'qualification', 'proposal', 'negotiation', 'won', 'lost'];
const STAGE_PROBABILITY = {
  lead: 10,
  qualification: 25,
  proposal: 50,
  negotiation: 75,
  won: 100,
  lost: 0
};

const idString = (value) => {
  if (!value) return '';
  return String(value._id || value);
};

const userCanAccessDeal = (req, deal) => {
  if (req.user.role !== 'agent') return true;

  const userId = String(req.user.userId);
  const isPrimaryAgent = idString(deal.agent) === userId;
  const isTeamMember = Array.isArray(deal.teamMembers) &&
    deal.teamMembers.some((member) => idString(member) === userId);

  return isPrimaryAgent || isTeamMember;
};

const agentDealAccessFilter = (userId) => ({
  $or: [
    { agent: userId },
    { teamMembers: userId }
  ]
});

const appendAndFilter = (query, filter) => {
  if (!filter) return query;
  return {
    ...query,
    $and: [...(query.$and || []), filter]
  };
};

// Apply tenant-aware middleware to all routes
router.use(tenantAuth);

// Get all deals (admin sees all, agents see their own)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, stage, client, agent, search, minValue, maxValue } = req.query;

    // Start with tenant-filtered query
    let query = { ...req.tenantQuery };

    // Agents can only see their own deals, or filter by specific agent if admin
    if (req.user.role === 'agent') {
      query = appendAndFilter(query, agentDealAccessFilter(req.user.userId));
    } else if (agent) {
      // Admin can filter by specific agent
      query.agent = agent;
    }

    // Apply filters
    if (stage) {
      query.stage = stage;
    }

    if (client) {
      query.client = client;
    }

    // Search filter
    if (search) {
      query = appendAndFilter(query, { $or: [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ] });
    }

    // Value range filters
    if (minValue || maxValue) {
      query.value = {};
      if (minValue) query.value.$gte = parseFloat(minValue);
      if (maxValue) query.value.$lte = parseFloat(maxValue);
    }

    const skip = (page - 1) * limit;

    const deals = await Deal.find(query)
      .populate('client', 'name email phone')
      .populate('agent', 'name email')
      .populate('teamMembers', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Deal.countDocuments(query);

    res.json({
      deals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get deal statistics
router.get('/stats', async (req, res) => {
  try {
    // Start with tenant-filtered query
    let query = { ...req.tenantQuery };

    // Agents can only see stats for their own deals
    if (req.user.role === 'agent') {
      query = appendAndFilter(query, agentDealAccessFilter(req.user.userId));
    }

    const deals = await Deal.find(query);

    const totalDeals = deals.length;
    const wonDeals = deals.filter(d => d.stage === 'won');
    const lostDeals = deals.filter(d => d.stage === 'lost');
    const pendingDeals = deals.filter(d => !['won', 'lost'].includes(d.stage));

    const totalValue = wonDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    const averageDealValue = wonDeals.length > 0 ? totalValue / wonDeals.length : 0;

    // Calculate success rate
    const successRate = totalDeals > 0 ? (wonDeals.length / totalDeals) * 100 : 0;

    // Get deals by stage
    const dealsByStage = {
      lead: deals.filter(d => d.stage === 'lead').length,
      qualification: deals.filter(d => d.stage === 'qualification').length,
      proposal: deals.filter(d => d.stage === 'proposal').length,
      negotiation: deals.filter(d => d.stage === 'negotiation').length,
      won: wonDeals.length,
      lost: lostDeals.length
    };

    res.json({
      totalStats: {
        totalDeals,
        wonCount: wonDeals.length,
        lostCount: lostDeals.length,
        pendingCount: pendingDeals.length,
        totalValue,
        averageDealValue,
        successRate: successRate.toFixed(1)
      },
      dealsByStage
    });
  } catch (error) {
    console.error('Error fetching deal stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get deal by ID
router.get('/:id', async (req, res) => {
  try {
    const deal = await Deal.findOne({ _id: req.params.id, ...req.tenantQuery })
      .populate('client', 'name email phone')
      .populate('agent', 'name email')
      .populate('teamMembers', 'name email')
      .populate('notes.createdBy', 'name')
      .populate('documents.uploadedBy', 'name')
      .populate('tasks.assignedTo', 'name')
      .populate('activities.createdBy', 'name');

    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    // Check if user has permission to view this deal
    if (!userCanAccessDeal(req, deal)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(deal);
  } catch (error) {
    console.error('Error fetching deal:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new deal
router.post('/', [
  body('title').notEmpty().withMessage('Title is required'),
  body('value').isNumeric().withMessage('Value must be a number'),
  body('client').notEmpty().withMessage('Client is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check usage limits
    if (!req.canAddDeals()) {
      return res.status(403).json({ 
        message: 'Deal limit reached for your subscription plan',
        limit: req.tenant.subscription?.features?.maxDeals || 0
      });
    }

    const dealData = {
      ...req.body,
      tenant: req.user.tenantId,
      agent: req.user.role === 'agent' ? req.user.userId : req.body.agent
    };

    const deal = new Deal(dealData);
    await deal.save();

    // Update tenant usage
    await req.updateTenantUsage('deals', 1);
    await logAction(req, 'CREATE_DEAL', `Created deal ${dealData.title}`, { entityType: 'Deal', entityId: deal._id });

    const populatedDeal = await Deal.findById(deal._id)
      .populate('client', 'name email phone')
      .populate('agent', 'name email');

    // Create notification for admins
    await createNotification({
      type: 'deal_created',
      actorId: req.user.userId,
      entityType: 'Deal',
      entityId: deal._id,
      metadata: {
        dealTitle: dealData.title,
        dealValue: dealData.value,
        clientName: dealData.client?.name || 'Unknown Client'
      }
    });

    res.status(201).json(populatedDeal);
  } catch (error) {
    console.error('Error creating deal:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update deal
router.put('/:id', async (req, res) => {
  try {
    const deal = await Deal.findOne({ _id: req.params.id, ...req.tenantQuery }).populate('client', 'name');

    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    // Check if user has permission to update this deal
    if (!userCanAccessDeal(req, deal)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const previousStage = deal.stage;

    // If closing the deal, set closedAt date
    if (req.body.stage && ['won', 'lost'].includes(req.body.stage) && !deal.closedAt) {
      req.body.closedAt = new Date();
    }
    if (req.body.stage) {
      if (!DEAL_STAGES.includes(req.body.stage)) {
        return res.status(400).json({ message: 'Invalid deal stage' });
      }
      req.body.probability = STAGE_PROBABILITY[req.body.stage] ?? deal.probability;
    }

    const updatedDeal = await Deal.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantQuery }, 
      req.body, 
      { new: true, runValidators: true }
    )
      .populate('client', 'name email phone')
      .populate('agent', 'name email')
      .populate('teamMembers', 'name email');

    if (!updatedDeal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    // Create notification for admins based on the change
    try {
      if (req.body.stage && req.body.stage !== previousStage) {
        // Stage changed
        if (req.body.stage === 'won') {
          await createNotification({
            type: 'deal_won',
            actorId: req.user.userId,
            entityType: 'deal',
            entityId: deal._id,
            metadata: {
              dealTitle: updatedDeal.title,
              value: updatedDeal.value,
              clientName: updatedDeal.client?.name || 'Unknown Client',
              previousStage: previousStage
            }
          });
        } else if (req.body.stage === 'lost') {
          await createNotification({
            type: 'deal_lost',
            actorId: req.user.userId,
            entityType: 'deal',
            entityId: deal._id,
            metadata: {
              dealTitle: updatedDeal.title,
              value: updatedDeal.value,
              clientName: updatedDeal.client?.name || 'Unknown Client',
              previousStage: previousStage
            }
          });
        } else {
          await createNotification({
            type: 'deal_updated',
            actorId: req.user.userId,
            entityType: 'deal',
            entityId: deal._id,
            metadata: {
              dealTitle: updatedDeal.title,
              change: `Stage changed from ${previousStage} to ${req.body.stage}`,
              clientName: updatedDeal.client?.name || 'Unknown Client'
            }
          });
        }
      } else {
        // General update (not stage change)
        await createNotification({
          type: 'deal_updated',
          actorId: req.user.userId,
          entityType: 'deal',
          entityId: deal._id,
          metadata: {
            dealTitle: updatedDeal.title,
            change: 'Deal details updated',
            clientName: updatedDeal.client?.name || 'Unknown Client'
          }
        });
      }
    } catch (notificationError) {
      console.warn('Failed to create deal update notification:', notificationError.message);
    }

    res.json(updatedDeal);
  } catch (error) {
    console.error('Error updating deal:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update deal status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    const deal = await Deal.findOne({ _id: req.params.id, ...req.tenantQuery }).populate('client', 'name');

    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    // Check if user has permission to update this deal
    if (!userCanAccessDeal(req, deal)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const previousStage = deal.stage;
    if (!DEAL_STAGES.includes(status)) {
      return res.status(400).json({ message: 'Invalid deal stage' });
    }

    const updateData = {
      stage: status,
      probability: STAGE_PROBABILITY[status] ?? deal.probability
    };

    // If closing the deal, set closedAt date
    if (['won', 'lost'].includes(status) && !deal.closedAt) {
      updateData.closedAt = new Date();
    }

    const updatedDeal = await Deal.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantQuery }, 
      updateData, 
      { new: true, runValidators: true }
    )
      .populate('client', 'name email phone')
      .populate('agent', 'name email');

    if (!updatedDeal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    // Create notification for admins
    try {
      if (status === 'won') {
        await createNotification({
          type: 'deal_won',
          actorId: req.user.userId,
          entityType: 'deal',
          entityId: deal._id,
          metadata: {
            dealTitle: updatedDeal.title,
            value: updatedDeal.value,
            clientName: updatedDeal.client?.name || 'Unknown Client',
            previousStage: previousStage
          }
        });
      } else if (status === 'lost') {
        await createNotification({
          type: 'deal_lost',
          actorId: req.user.userId,
          entityType: 'deal',
          entityId: deal._id,
          metadata: {
            dealTitle: updatedDeal.title,
            value: updatedDeal.value,
            clientName: updatedDeal.client?.name || 'Unknown Client',
            previousStage: previousStage
          }
        });
      } else if (status !== previousStage) {
        await createNotification({
          type: 'deal_updated',
          actorId: req.user.userId,
          entityType: 'deal',
          entityId: deal._id,
          metadata: {
            dealTitle: updatedDeal.title,
            change: `Stage changed from ${previousStage} to ${status}`,
            clientName: updatedDeal.client?.name || 'Unknown Client'
          }
        });
      }
    } catch (notificationError) {
      console.warn('Failed to create deal status notification:', notificationError.message);
    }

    res.json(updatedDeal);
  } catch (error) {
    console.error('Error updating deal status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete deal
router.delete('/:id', async (req, res) => {
  try {
    const deal = await Deal.findOne({ _id: req.params.id, ...req.tenantQuery });

    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    // Check if user has permission to delete this deal
    if (!userCanAccessDeal(req, deal)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Deal.findOneAndDelete({ _id: req.params.id, ...req.tenantQuery });
    await req.updateTenantUsage('deals', -1);
    await logAction(req, 'DELETE_DEAL', `Deleted deal ${deal.title}`, { entityType: 'Deal', entityId: deal._id });
    res.json({ message: 'Deal deleted successfully' });
  } catch (error) {
    console.error('Error deleting deal:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export { router as dealRoutes };
