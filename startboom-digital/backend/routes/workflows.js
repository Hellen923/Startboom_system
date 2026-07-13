// routes/workflows.js
import express from 'express';
import Workflow from '../models/Workflow.js';
import WorkflowExecution from '../models/WorkflowExecution.js';
import { tenantAuth, requireTenantModule } from '../middleware/tenantAuth.js';
import { executeWorkflow } from '../services/workflowEngine.js';

const router = express.Router();

// Apply tenant authentication and module enforcement
router.use(tenantAuth);
router.use(requireTenantModule('workflows'));


// Get all workflows
router.get('/', async (req, res) => {
  try {
    const { triggerType, isActive, isTemplate } = req.query;
    
    const query = {
      ...req.tenantQuery
    };
    
    if (triggerType) query['trigger.type'] = triggerType;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (isTemplate !== undefined) query.isTemplate = isTemplate === 'true';
    
    const workflows = await Workflow.find(query)
      .populate('createdBy', 'name email')
      .sort({ 'settings.priority': -1, name: 1 });
    
    res.json({
      success: true,
      count: workflows.length,
      workflows
    });
  } catch (error) {
    console.error('Get workflows error:', error);
    res.status(500).json({
      message: 'Error fetching workflows',
      error: error.message
    });
  }
});

// Get workflow templates
router.get('/templates', async (req, res) => {
  try {
    const { category } = req.query;
    
    const templates = await Workflow.getTemplates(category);
    
    res.json({
      success: true,
      count: templates.length,
      templates
    });
  } catch (error) {
    console.error('Get workflow templates error:', error);
    res.status(500).json({
      message: 'Error fetching workflow templates',
      error: error.message
    });
  }
});

// Get single workflow
router.get('/:id', async (req, res) => {
  try {
    const workflow = await Workflow.findOne({
      _id: req.params.id,
      ...req.tenantQuery
    }).populate('createdBy updatedBy', 'name email');
    
    if (!workflow) {
      return res.status(404).json({
        message: 'Workflow not found'
      });
    }
    
    res.json({
      success: true,
      workflow
    });
  } catch (error) {
    console.error('Get workflow error:', error);
    res.status(500).json({
      message: 'Error fetching workflow',
      error: error.message
    });
  }
});

// Create workflow
router.post('/', async (req, res) => {
  try {
    // Only admins can create workflows
    if (!['superadmin', 'admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Only administrators and managers can create workflows'
      });
    }
    
    const {
      name, description, trigger, actions, settings, isTemplate, templateCategory
    } = req.body;
    
    const workflow = new Workflow({
      ...req.tenantQuery,
      name: name.trim(),
      description: description || '',
      trigger,
      actions: actions || [],
      settings: settings || {},
      isTemplate: isTemplate || false,
      templateCategory,
      createdBy: req.user.userId
    });
    
    await workflow.save();
    
    res.status(201).json({
      success: true,
      message: 'Workflow created successfully',
      workflow
    });
  } catch (error) {
    console.error('Create workflow error:', error);
    res.status(500).json({
      message: 'Error creating workflow',
      error: error.message
    });
  }
});

// Update workflow
router.put('/:id', async (req, res) => {
  try {
    if (!['superadmin', 'admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Only administrators and managers can update workflows'
      });
    }
    
    const workflow = await Workflow.findOne({
      _id: req.params.id,
      ...req.tenantQuery
    });
    
    if (!workflow) {
      return res.status(404).json({
        message: 'Workflow not found'
      });
    }
    
    const { name, description, trigger, actions, settings, isActive } = req.body;
    
    if (name) workflow.name = name.trim();
    if (description !== undefined) workflow.description = description;
    if (trigger) workflow.trigger = trigger;
    if (actions) workflow.actions = actions;
    if (settings) workflow.settings = { ...workflow.settings, ...settings };
    if (isActive !== undefined) workflow.isActive = isActive;
    
    workflow.updatedBy = req.user.userId;
    
    await workflow.save();
    
    res.json({
      success: true,
      message: 'Workflow updated successfully',
      workflow
    });
  } catch (error) {
    console.error('Update workflow error:', error);
    res.status(500).json({
      message: 'Error updating workflow',
      error: error.message
    });
  }
});

// Clone workflow
router.post('/:id/clone', async (req, res) => {
  try {
    if (!['superadmin', 'admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Only administrators and managers can clone workflows'
      });
    }
    
    const workflow = await Workflow.findOne({
      _id: req.params.id,
      ...req.tenantQuery
    });
    
    if (!workflow) {
      return res.status(404).json({
        message: 'Workflow not found'
      });
    }
    
    const { name } = req.body;
    const clonedWorkflow = await workflow.clone(name);
    clonedWorkflow.createdBy = req.user.userId;
    await clonedWorkflow.save();
    
    res.status(201).json({
      success: true,
      message: 'Workflow cloned successfully',
      workflow: clonedWorkflow
    });
  } catch (error) {
    console.error('Clone workflow error:', error);
    res.status(500).json({
      message: 'Error cloning workflow',
      error: error.message
    });
  }
});

// Execute workflow manually
router.post('/:id/execute', async (req, res) => {
  try {
    if (!['superadmin', 'admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Only administrators and managers can execute workflows'
      });
    }
    
    const { entityId, entityType, triggerData } = req.body;
    
    // Load entity if provided
    let entity = null;
    if (entityId && entityType) {
      const Model = await import(`../models/${entityType}.js`);
      entity = await Model.default.findById(entityId);
    }
    
    const execution = await executeWorkflow(req.params.id, entity, triggerData || {});
    
    res.json({
      success: true,
      message: 'Workflow executed successfully',
      execution
    });
  } catch (error) {
    console.error('Execute workflow error:', error);
    res.status(500).json({
      message: 'Error executing workflow',
      error: error.message
    });
  }
});

// Get workflow executions
router.get('/:id/executions', async (req, res) => {
  try {
    const { status, limit = 50, skip = 0 } = req.query;
    
    const query = {
      workflow: req.params.id,
      ...req.tenantQuery
    };
    
    if (status) query.status = status;
    
    const executions = await WorkflowExecution.find(query)
      .populate('triggerEntity')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));
    
    const total = await WorkflowExecution.countDocuments(query);
    
    res.json({
      success: true,
      count: executions.length,
      total,
      executions
    });
  } catch (error) {
    console.error('Get workflow executions error:', error);
    res.status(500).json({
      message: 'Error fetching workflow executions',
      error: error.message
    });
  }
});

// Get execution stats
router.get('/:id/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const stats = await WorkflowExecution.getStats(
      req.user.tenantId,
      req.params.id,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get workflow stats error:', error);
    res.status(500).json({
      message: 'Error fetching workflow stats',
      error: error.message
    });
  }
});

// Toggle workflow active status
router.patch('/:id/toggle', async (req, res) => {
  try {
    if (!['superadmin', 'admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Only administrators and managers can toggle workflows'
      });
    }
    
    const workflow = await Workflow.findOne({
      _id: req.params.id,
      ...req.tenantQuery
    });
    
    if (!workflow) {
      return res.status(404).json({
        message: 'Workflow not found'
      });
    }
    
    workflow.settings.isActive = !workflow.settings.isActive;
    workflow.updatedBy = req.user.userId;
    await workflow.save();
    
    res.json({
      success: true,
      message: `Workflow ${workflow.settings.isActive ? 'activated' : 'deactivated'}`,
      isActive: workflow.settings.isActive
    });
  } catch (error) {
    console.error('Toggle workflow error:', error);
    res.status(500).json({
      message: 'Error toggling workflow',
      error: error.message
    });
  }
});

// Delete workflow
router.delete('/:id', async (req, res) => {
  try {
    if (!(req.isSuperAdmin || req.user.role === 'admin')) {
      return res.status(403).json({
        message: 'Only administrators can delete workflows'
      });
    }
    
    const workflow = await Workflow.findOne({
      _id: req.params.id,
      ...req.tenantQuery
    });
    
    if (!workflow) {
      return res.status(404).json({
        message: 'Workflow not found'
      });
    }
    
    workflow.isActive = false;
    workflow.updatedBy = req.user.userId;
    await workflow.save();
    
    res.json({
      success: true,
      message: 'Workflow deleted successfully'
    });
  } catch (error) {
    console.error('Delete workflow error:', error);
    res.status(500).json({
      message: 'Error deleting workflow',
      error: error.message
    });
  }
});

export default router;
