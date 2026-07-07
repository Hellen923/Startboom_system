// routes/reports2.js (Advanced custom reports)
import express from 'express';
import Report from '../models/Report.js';
import { auth } from '../middleware/auth.js';
import { executeReport } from '../services/reportEngine.js';

const router = express.Router();

// Get all reports
router.get('/', auth, async (req, res) => {
  try {
    const { type, dataSource, isTemplate } = req.query;
    
    const query = {
      tenant: req.user.tenant,
      isActive: true
    };
    
    if (type) query.type = type;
    if (dataSource) query['dataSource.entity'] = dataSource;
    if (isTemplate !== undefined) query.isTemplate = isTemplate === 'true';
    
    // Access control
    if (!['superadmin', 'admin'].includes(req.user.role)) {
      query.$or = [
        { owner: req.user._id },
        { visibility: 'company' },
        { 'sharedWith.id': req.user._id }
      ];
    }
    
    const reports = await Report.find(query)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      message: 'Error fetching reports',
      error: error.message
    });
  }
});

// Get report templates
router.get('/templates', auth, async (req, res) => {
  try {
    const { category } = req.query;
    
    const templates = await Report.getTemplates(category);
    
    res.json({
      success: true,
      count: templates.length,
      templates
    });
  } catch (error) {
    console.error('Get report templates error:', error);
    res.status(500).json({
      message: 'Error fetching report templates',
      error: error.message
    });
  }
});

// Get single report
router.get('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
      isActive: true
    }).populate('owner createdBy updatedBy', 'name email');
    
    if (!report) {
      return res.status(404).json({
        message: 'Report not found'
      });
    }
    
    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      message: 'Error fetching report',
      error: error.message
    });
  }
});

// Create report
router.post('/', auth, async (req, res) => {
  try {
    const {
      name, description, type, dataSource, groupBy, visualization,
      calculatedFields, schedule, visibility, sharedWith,
      isTemplate, templateCategory
    } = req.body;
    
    const report = new Report({
      tenant: req.user.tenant,
      name: name.trim(),
      description: description || '',
      type: type || 'summary',
      dataSource,
      groupBy: groupBy || [],
      visualization: visualization || { type: 'table' },
      calculatedFields: calculatedFields || [],
      schedule: schedule || { enabled: false },
      visibility: visibility || 'private',
      sharedWith: sharedWith || [],
      isTemplate: isTemplate || false,
      templateCategory,
      owner: req.user._id,
      createdBy: req.user._id
    });
    
    // Calculate next run if scheduled
    if (report.schedule.enabled) {
      report.schedule.nextRun = report.calculateNextRun();
    }
    
    await report.save();
    
    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      report
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({
      message: 'Error creating report',
      error: error.message
    });
  }
});

// Update report
router.put('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
      isActive: true
    });
    
    if (!report) {
      return res.status(404).json({
        message: 'Report not found'
      });
    }
    
    // Check permission
    if (report.owner.toString() !== req.user._id.toString() &&
        !['superadmin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Permission denied'
      });
    }
    
    const {
      name, description, dataSource, groupBy, visualization,
      calculatedFields, schedule, visibility, sharedWith
    } = req.body;
    
    if (name) report.name = name.trim();
    if (description !== undefined) report.description = description;
    if (dataSource) report.dataSource = dataSource;
    if (groupBy) report.groupBy = groupBy;
    if (visualization) report.visualization = visualization;
    if (calculatedFields) report.calculatedFields = calculatedFields;
    if (schedule) {
      report.schedule = { ...report.schedule, ...schedule };
      if (report.schedule.enabled) {
        report.schedule.nextRun = report.calculateNextRun();
      }
    }
    if (visibility) report.visibility = visibility;
    if (sharedWith) report.sharedWith = sharedWith;
    
    report.updatedBy = req.user._id;
    
    await report.save();
    
    res.json({
      success: true,
      message: 'Report updated successfully',
      report
    });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({
      message: 'Error updating report',
      error: error.message
    });
  }
});

// Execute/run report
router.post('/:id/execute', auth, async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
      isActive: true
    });
    
    if (!report) {
      return res.status(404).json({
        message: 'Report not found'
      });
    }
    
    // Execute report
    const result = await executeReport(report);
    
    res.json(result);
  } catch (error) {
    console.error('Execute report error:', error);
    res.status(500).json({
      message: 'Error executing report',
      error: error.message
    });
  }
});

// Clone report
router.post('/:id/clone', auth, async (req, res) => {
  try {
    const original = await Report.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
      isActive: true
    });
    
    if (!original) {
      return res.status(404).json({
        message: 'Report not found'
      });
    }
    
    const { name } = req.body;
    
    const cloned = new Report({
      ...original.toObject(),
      _id: undefined,
      name: name || `${original.name} (Copy)`,
      owner: req.user._id,
      createdBy: req.user._id,
      isTemplate: false,
      stats: {
        runs: 0,
        favorites: 0
      }
    });
    
    await cloned.save();
    
    res.status(201).json({
      success: true,
      message: 'Report cloned successfully',
      report: cloned
    });
  } catch (error) {
    console.error('Clone report error:', error);
    res.status(500).json({
      message: 'Error cloning report',
      error: error.message
    });
  }
});

// Delete report
router.delete('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
      isActive: true
    });
    
    if (!report) {
      return res.status(404).json({
        message: 'Report not found'
      });
    }
    
    // Only owner or admin can delete
    if (report.owner.toString() !== req.user._id.toString() &&
        !['superadmin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Permission denied'
      });
    }
    
    report.isActive = false;
    await report.save();
    
    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      message: 'Error deleting report',
      error: error.message
    });
  }
});

export default router;
