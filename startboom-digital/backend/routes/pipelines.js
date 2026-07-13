// routes/pipelines.js
import express from 'express';
import Pipeline from '../models/Pipeline.js';
import { tenantAuth, requireTenantModule } from '../middleware/tenantAuth.js';

const router = express.Router();

// Apply tenant authentication and module enforcement
router.use(tenantAuth);
router.use(requireTenantModule('deals'));


// Get all pipelines (optionally filter by entity type)
router.get('/', async (req, res) => {
  try {
    const { entityType } = req.query;
    
    const query = {
      ...req.tenantQuery,
      isActive: true
    };
    
    if (entityType) {
      query.entityType = entityType;
    }
    
    const pipelines = await Pipeline.find(query)
      .populate('createdBy', 'name email')
      .sort({ isDefault: -1, name: 1 });
    
    res.json({
      success: true,
      count: pipelines.length,
      pipelines
    });
  } catch (error) {
    console.error('Get pipelines error:', error);
    res.status(500).json({
      message: 'Error fetching pipelines',
      error: error.message
    });
  }
});

// Get default pipeline for entity type
router.get('/default/:entityType', async (req, res) => {
  try {
    const pipeline = await Pipeline.getDefault(
      req.user.tenantId,
      req.params.entityType
    );
    
    if (!pipeline) {
      return res.status(404).json({
        message: `No default pipeline found for ${req.params.entityType}`
      });
    }
    
    res.json({
      success: true,
      pipeline
    });
  } catch (error) {
    console.error('Get default pipeline error:', error);
    res.status(500).json({
      message: 'Error fetching default pipeline',
      error: error.message
    });
  }
});

// Get single pipeline by ID
router.get('/:id', async (req, res) => {
  try {
    const pipeline = await Pipeline.findOne({
      _id: req.params.id,
      ...req.tenantQuery
    }).populate('createdBy', 'name email');
    
    if (!pipeline) {
      return res.status(404).json({
        message: 'Pipeline not found'
      });
    }
    
    res.json({
      success: true,
      pipeline
    });
  } catch (error) {
    console.error('Get pipeline error:', error);
    res.status(500).json({
      message: 'Error fetching pipeline',
      error: error.message
    });
  }
});

// Create pipeline
router.post('/', async (req, res) => {
  try {
    // Only admins can create pipelines
    if (!(req.isSuperAdmin || req.user.role === 'admin')) {
      return res.status(403).json({
        message: 'Only administrators can create pipelines'
      });
    }
    
    const { name, description, entityType, stages, isDefault, departments, settings } = req.body;
    
    // Check if name already exists
    const existing = await Pipeline.findOne({
      ...req.tenantQuery,
      name: name.trim()
    });
    
    if (existing) {
      return res.status(400).json({
        message: 'A pipeline with this name already exists'
      });
    }
    
    // If setting as default, unset other defaults
    if (isDefault) {
      await Pipeline.updateMany(
        { ...req.tenantQuery, entityType: entityType, isDefault: true },
        { $set: { isDefault: false } }
      );
    }
    
    const pipeline = new Pipeline({
      ...req.tenantQuery,
      name: name.trim(),
      description: description || '',
      entityType: entityType || 'deal',
      stages: stages || [],
      isDefault: isDefault || false,
      departments: departments || [],
      settings: settings || {},
      createdBy: req.user.userId
    });
    
    await pipeline.save();
    
    res.status(201).json({
      success: true,
      message: 'Pipeline created successfully',
      pipeline
    });
  } catch (error) {
    console.error('Create pipeline error:', error);
    res.status(500).json({
      message: 'Error creating pipeline',
      error: error.message
    });
  }
});

// Update pipeline
router.put('/:id', async (req, res) => {
  try {
    if (!(req.isSuperAdmin || req.user.role === 'admin')) {
      return res.status(403).json({
        message: 'Only administrators can update pipelines'
      });
    }
    
    const pipeline = await Pipeline.findOne({
      _id: req.params.id,
      ...req.tenantQuery
    });
    
    if (!pipeline) {
      return res.status(404).json({
        message: 'Pipeline not found'
      });
    }
    
    const { name, description, stages, isDefault, departments, settings, isActive } = req.body;
    
    // Check name uniqueness if changing
    if (name && name !== pipeline.name) {
      const existing = await Pipeline.findOne({
        ...req.tenantQuery,
        name: name.trim(),
        _id: { $ne: pipeline._id }
      });
      
      if (existing) {
        return res.status(400).json({
          message: 'A pipeline with this name already exists'
        });
      }
      pipeline.name = name.trim();
    }
    
    // If setting as default, unset other defaults
    if (isDefault && !pipeline.isDefault) {
      await Pipeline.updateMany(
        { 
          ...req.tenantQuery, 
          entityType: pipeline.entityType, 
          isDefault: true,
          _id: { $ne: pipeline._id }
        },
        { $set: { isDefault: false } }
      );
    }
    
    if (description !== undefined) pipeline.description = description;
    if (stages) pipeline.stages = stages;
    if (isDefault !== undefined) pipeline.isDefault = isDefault;
    if (departments) pipeline.departments = departments;
    if (settings) pipeline.settings = { ...pipeline.settings, ...settings };
    if (isActive !== undefined) pipeline.isActive = isActive;
    
    pipeline.updatedBy = req.user.userId;
    
    await pipeline.save();
    
    res.json({
      success: true,
      message: 'Pipeline updated successfully',
      pipeline
    });
  } catch (error) {
    console.error('Update pipeline error:', error);
    res.status(500).json({
      message: 'Error updating pipeline',
      error: error.message
    });
  }
});

// Add stage to pipeline
router.post('/:id/stages', async (req, res) => {
  try {
    if (!(req.isSuperAdmin || req.user.role === 'admin')) {
      return res.status(403).json({
        message: 'Only administrators can modify pipeline stages'
      });
    }
    
    const pipeline = await Pipeline.findOne({
      _id: req.params.id,
      ...req.tenantQuery
    });
    
    if (!pipeline) {
      return res.status(404).json({
        message: 'Pipeline not found'
      });
    }
    
    await pipeline.addStage(req.body);
    
    res.json({
      success: true,
      message: 'Stage added to pipeline',
      stages: pipeline.stages
    });
  } catch (error) {
    console.error('Add stage error:', error);
    res.status(500).json({
      message: 'Error adding stage',
      error: error.message
    });
  }
});

// Remove stage from pipeline
router.delete('/:id/stages/:stageName', async (req, res) => {
  try {
    if (!(req.isSuperAdmin || req.user.role === 'admin')) {
      return res.status(403).json({
        message: 'Only administrators can modify pipeline stages'
      });
    }
    
    const pipeline = await Pipeline.findOne({
      _id: req.params.id,
      ...req.tenantQuery
    });
    
    if (!pipeline) {
      return res.status(404).json({
        message: 'Pipeline not found'
      });
    }
    
    await pipeline.removeStage(req.params.stageName);
    
    res.json({
      success: true,
      message: 'Stage removed from pipeline',
      stages: pipeline.stages
    });
  } catch (error) {
    console.error('Remove stage error:', error);
    res.status(500).json({
      message: 'Error removing stage',
      error: error.message
    });
  }
});

// Reorder stages
router.put('/:id/stages/reorder', async (req, res) => {
  try {
    if (!(req.isSuperAdmin || req.user.role === 'admin')) {
      return res.status(403).json({
        message: 'Only administrators can reorder stages'
      });
    }
    
    const { stageOrder } = req.body; // Array of stage names in desired order
    
    const pipeline = await Pipeline.findOne({
      _id: req.params.id,
      ...req.tenantQuery
    });
    
    if (!pipeline) {
      return res.status(404).json({
        message: 'Pipeline not found'
      });
    }
    
    await pipeline.reorderStages(stageOrder);
    
    res.json({
      success: true,
      message: 'Stages reordered successfully',
      stages: pipeline.stages
    });
  } catch (error) {
    console.error('Reorder stages error:', error);
    res.status(500).json({
      message: 'Error reordering stages',
      error: error.message
    });
  }
});

// Delete (soft delete) pipeline
router.delete('/:id', async (req, res) => {
  try {
    if (!(req.isSuperAdmin || req.user.role === 'admin')) {
      return res.status(403).json({
        message: 'Only administrators can delete pipelines'
      });
    }
    
    const pipeline = await Pipeline.findOne({
      _id: req.params.id,
      ...req.tenantQuery
    });
    
    if (!pipeline) {
      return res.status(404).json({
        message: 'Pipeline not found'
      });
    }
    
    // Don't allow deleting default pipeline if it's the only one
    if (pipeline.isDefault) {
      const otherPipelines = await Pipeline.countDocuments({
        ...req.tenantQuery,
        entityType: pipeline.entityType,
        isActive: true,
        _id: { $ne: pipeline._id }
      });
      
      if (otherPipelines === 0) {
        return res.status(400).json({
          message: 'Cannot delete the only active pipeline. Create another one first.'
        });
      }
    }
    
    pipeline.isActive = false;
    pipeline.updatedBy = req.user.userId;
    await pipeline.save();
    
    res.json({
      success: true,
      message: 'Pipeline deleted successfully'
    });
  } catch (error) {
    console.error('Delete pipeline error:', error);
    res.status(500).json({
      message: 'Error deleting pipeline',
      error: error.message
    });
  }
});

// Create default sales pipeline for tenant
router.post('/setup/default', async (req, res) => {
  try {
    if (!(req.isSuperAdmin || req.user.role === 'admin')) {
      return res.status(403).json({
        message: 'Only administrators can create default pipelines'
      });
    }
    
    // Check if default already exists
    const existing = await Pipeline.getDefault(req.user.tenantId, 'deal');
    
    if (existing) {
      return res.status(400).json({
        message: 'Default pipeline already exists'
      });
    }
    
    const pipeline = await Pipeline.createDefaultSalesPipeline(
      req.user.tenantId,
      req.user.userId
    );
    
    res.status(201).json({
      success: true,
      message: 'Default sales pipeline created',
      pipeline
    });
  } catch (error) {
    console.error('Create default pipeline error:', error);
    res.status(500).json({
      message: 'Error creating default pipeline',
      error: error.message
    });
  }
});

export default router;
