// routes/customFields.js
import express from 'express';
import CustomField from '../models/CustomField.js';
import { tenantAuth, requireTenantModule } from '../middleware/tenantAuth.js';

const router = express.Router();

// Apply tenant authentication and module enforcement
router.use(tenantAuth);
router.use(requireTenantModule('customFields'));


// Get all custom fields (optionally filter by entity type)
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
    
    const fields = await CustomField.find(query)
      .sort({ 'ui.order': 1 });
    
    res.json({
      success: true,
      count: fields.length,
      fields
    });
  } catch (error) {
    console.error('Get custom fields error:', error);
    res.status(500).json({
      message: 'Error fetching custom fields',
      error: error.message
    });
  }
});

// Get fields for specific entity
router.get('/entity/:entityType', async (req, res) => {
  try {
    const fields = await CustomField.getFieldsForEntity(
      req.user.tenantId,
      req.params.entityType
    );
    
    res.json({
      success: true,
      count: fields.length,
      fields
    });
  } catch (error) {
    console.error('Get entity fields error:', error);
    res.status(500).json({
      message: 'Error fetching entity fields',
      error: error.message
    });
  }
});

// Get single custom field
router.get('/:id', async (req, res) => {
  try {
    const field = await CustomField.findOne({
      _id: req.params.id,
      ...req.tenantQuery
    });
    
    if (!field) {
      return res.status(404).json({
        message: 'Custom field not found'
      });
    }
    
    res.json({
      success: true,
      field
    });
  } catch (error) {
    console.error('Get custom field error:', error);
    res.status(500).json({
      message: 'Error fetching custom field',
      error: error.message
    });
  }
});

// Create custom field
router.post('/', async (req, res) => {
  try {
    // Only admins can create custom fields
    if (!(req.isSuperAdmin || req.user.role === 'admin')) {
      return res.status(403).json({
        message: 'Only administrators can create custom fields'
      });
    }
    
    const {
      entityType, fieldName, fieldLabel, fieldType,
      options, defaultValue, validation, ui, permissions,
      isCalculated, formula
    } = req.body;
    
    // Check if field name already exists for this entity
    const existing = await CustomField.findOne({
      ...req.tenantQuery,
      entityType: entityType,
      fieldName: fieldName.toLowerCase().trim()
    });
    
    if (existing) {
      return res.status(400).json({
        message: 'A field with this name already exists for this entity'
      });
    }
    
    const field = new CustomField({
      ...req.tenantQuery,
      entityType,
      fieldName: fieldName.toLowerCase().trim(),
      fieldLabel: fieldLabel.trim(),
      fieldType,
      options: options || [],
      defaultValue,
      validation: validation || {},
      ui: ui || {},
      permissions: permissions || {},
      isCalculated: isCalculated || false,
      formula: formula || null,
      createdBy: req.user.userId
    });
    
    await field.save();
    
    res.status(201).json({
      success: true,
      message: 'Custom field created successfully',
      field
    });
  } catch (error) {
    console.error('Create custom field error:', error);
    res.status(500).json({
      message: 'Error creating custom field',
      error: error.message
    });
  }
});

// Update custom field
router.put('/:id', async (req, res) => {
  try {
    if (!(req.isSuperAdmin || req.user.role === 'admin')) {
      return res.status(403).json({
        message: 'Only administrators can update custom fields'
      });
    }
    
    const field = await CustomField.findOne({
      _id: req.params.id,
      ...req.tenantQuery
    });
    
    if (!field) {
      return res.status(404).json({
        message: 'Custom field not found'
      });
    }
    
    const {
      fieldLabel, fieldType, options, defaultValue,
      validation, ui, permissions, isCalculated, formula, isActive
    } = req.body;
    
    // Don't allow changing fieldName or entityType after creation
    // (would break existing data)
    
    if (fieldLabel) field.fieldLabel = fieldLabel.trim();
    if (fieldType) field.fieldType = fieldType;
    if (options) field.options = options;
    if (defaultValue !== undefined) field.defaultValue = defaultValue;
    if (validation) field.validation = { ...field.validation, ...validation };
    if (ui) field.ui = { ...field.ui, ...ui };
    if (permissions) field.permissions = { ...field.permissions, ...permissions };
    if (isCalculated !== undefined) field.isCalculated = isCalculated;
    if (formula !== undefined) field.formula = formula;
    if (isActive !== undefined) field.isActive = isActive;
    
    field.updatedBy = req.user.userId;
    
    await field.save();
    
    res.json({
      success: true,
      message: 'Custom field updated successfully',
      field
    });
  } catch (error) {
    console.error('Update custom field error:', error);
    res.status(500).json({
      message: 'Error updating custom field',
      error: error.message
    });
  }
});

// Delete (soft delete) custom field
router.delete('/:id', async (req, res) => {
  try {
    if (!(req.isSuperAdmin || req.user.role === 'admin')) {
      return res.status(403).json({
        message: 'Only administrators can delete custom fields'
      });
    }
    
    const field = await CustomField.findOne({
      _id: req.params.id,
      ...req.tenantQuery
    });
    
    if (!field) {
      return res.status(404).json({
        message: 'Custom field not found'
      });
    }
    
    // Soft delete - don't actually remove (data still exists)
    field.isActive = false;
    field.updatedBy = req.user.userId;
    await field.save();
    
    res.json({
      success: true,
      message: 'Custom field deleted successfully'
    });
  } catch (error) {
    console.error('Delete custom field error:', error);
    res.status(500).json({
      message: 'Error deleting custom field',
      error: error.message
    });
  }
});

// Validate data against custom fields
router.post('/validate', async (req, res) => {
  try {
    const { entityType, data } = req.body;
    
    const result = await CustomField.validateEntityData(
      req.user.tenantId,
      entityType,
      data
    );
    
    res.json({
      success: true,
      valid: result.valid,
      errors: result.errors
    });
  } catch (error) {
    console.error('Validate custom fields error:', error);
    res.status(500).json({
      message: 'Error validating custom fields',
      error: error.message
    });
  }
});

// Reorder custom fields
router.put('/reorder/:entityType', async (req, res) => {
  try {
    if (!(req.isSuperAdmin || req.user.role === 'admin')) {
      return res.status(403).json({
        message: 'Only administrators can reorder custom fields'
      });
    }
    
    const { fieldOrder } = req.body; // Array of field IDs in desired order
    
    const updatePromises = fieldOrder.map((fieldId, index) => {
      return CustomField.updateOne(
        { _id: fieldId, ...req.tenantQuery },
        { $set: { 'ui.order': index + 1, updatedBy: req.user.userId } }
      );
    });
    
    await Promise.all(updatePromises);
    
    res.json({
      success: true,
      message: 'Fields reordered successfully'
    });
  } catch (error) {
    console.error('Reorder fields error:', error);
    res.status(500).json({
      message: 'Error reordering fields',
      error: error.message
    });
  }
});

export default router;
