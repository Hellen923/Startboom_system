// models/CustomField.js
import mongoose from 'mongoose';

const customFieldSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant is required'],
    index: true
  },
  
  // Which entity does this field belong to?
  entityType: {
    type: String,
    required: [true, 'Entity type is required'],
    enum: ['client', 'deal', 'sale', 'product', 'meeting', 'user', 'contact'],
    index: true
  },
  
  // Field identification
  fieldName: {
    type: String,
    required: [true, 'Field name is required'],
    trim: true,
    lowercase: true
    // e.g., "policy_number", "property_type"
  },
  
  fieldLabel: {
    type: String,
    required: [true, 'Field label is required'],
    trim: true
    // e.g., "Policy Number", "Property Type"
  },
  
  fieldType: {
    type: String,
    required: [true, 'Field type is required'],
    enum: [
      'text', 'textarea', 'number', 'email', 'phone', 'url',
      'date', 'datetime', 'time',
      'checkbox', 'radio', 'dropdown', 'multi_select',
      'currency', 'percentage',
      'file', 'image',
      'user', 'department', 'branch'
    ]
  },
  
  // For dropdown, radio, multi_select
  options: [{
    label: String,
    value: String,
    color: String
  }],
  
  // Default value
  defaultValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  // Validation rules
  validation: {
    required: { type: Boolean, default: false },
    unique: { type: Boolean, default: false },
    minLength: { type: Number, default: null },
    maxLength: { type: Number, default: null },
    min: { type: Number, default: null },
    max: { type: Number, default: null },
    pattern: { type: String, default: null }, // Regex pattern
    customValidation: { type: String, default: null } // JS function as string
  },
  
  // UI settings
  ui: {
    placeholder: { type: String, default: '' },
    helpText: { type: String, default: '' },
    icon: { type: String, default: '' },
    width: { type: String, enum: ['full', 'half', 'third', 'quarter'], default: 'full' },
    order: { type: Number, default: 999 },
    section: { type: String, default: 'additional_info' }, // Group fields into sections
    isVisible: { type: Boolean, default: true },
    isReadOnly: { type: Boolean, default: false },
    conditionalVisibility: {
      enabled: { type: Boolean, default: false },
      dependsOn: { type: String, default: '' }, // Field name
      condition: { type: String, default: 'equals' }, // equals, not_equals, contains, etc.
      value: { type: mongoose.Schema.Types.Mixed, default: null }
    }
  },
  
  // Permissions - which roles can see/edit this field
  permissions: {
    viewRoles: [{ type: String }], // empty = all roles
    editRoles: [{ type: String }]  // empty = all roles
  },
  
  // For calculated/formula fields
  isCalculated: {
    type: Boolean,
    default: false
  },
  
  formula: {
    type: String,
    default: null
    // e.g., "dealValue * 0.1" for 10% commission
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
customFieldSchema.index({ tenant: 1, entityType: 1, fieldName: 1 }, { unique: true });
customFieldSchema.index({ tenant: 1, entityType: 1, isActive: 1 });
customFieldSchema.index({ 'ui.order': 1 });

// Method to validate a value against this field's rules
customFieldSchema.methods.validateValue = function(value) {
  const errors = [];
  const { validation } = this;
  
  // Required check
  if (validation.required && (value === null || value === undefined || value === '')) {
    errors.push(`${this.fieldLabel} is required`);
  }
  
  // Skip other validations if value is empty and not required
  if (!value && !validation.required) {
    return { valid: true, errors: [] };
  }
  
  // Type-specific validation
  switch (this.fieldType) {
    case 'email':
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(value)) {
        errors.push(`${this.fieldLabel} must be a valid email`);
      }
      break;
      
    case 'phone':
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
      if (!phoneRegex.test(value)) {
        errors.push(`${this.fieldLabel} must be a valid phone number`);
      }
      break;
      
    case 'url':
      try {
        new URL(value);
      } catch (e) {
        errors.push(`${this.fieldLabel} must be a valid URL`);
      }
      break;
      
    case 'number':
    case 'currency':
    case 'percentage':
      if (isNaN(value)) {
        errors.push(`${this.fieldLabel} must be a number`);
      } else {
        const numValue = parseFloat(value);
        if (validation.min !== null && numValue < validation.min) {
          errors.push(`${this.fieldLabel} must be at least ${validation.min}`);
        }
        if (validation.max !== null && numValue > validation.max) {
          errors.push(`${this.fieldLabel} must be at most ${validation.max}`);
        }
      }
      break;
  }
  
  // String length validation
  if (typeof value === 'string') {
    if (validation.minLength && value.length < validation.minLength) {
      errors.push(`${this.fieldLabel} must be at least ${validation.minLength} characters`);
    }
    if (validation.maxLength && value.length > validation.maxLength) {
      errors.push(`${this.fieldLabel} must be at most ${validation.maxLength} characters`);
    }
  }
  
  // Pattern validation
  if (validation.pattern) {
    const regex = new RegExp(validation.pattern);
    if (!regex.test(value)) {
      errors.push(`${this.fieldLabel} format is invalid`);
    }
  }
  
  // Dropdown/select validation
  if (['dropdown', 'radio'].includes(this.fieldType)) {
    const validOptions = this.options.map(opt => opt.value);
    if (!validOptions.includes(value)) {
      errors.push(`${this.fieldLabel} must be one of: ${validOptions.join(', ')}`);
    }
  }
  
  // Multi-select validation
  if (this.fieldType === 'multi_select') {
    if (!Array.isArray(value)) {
      errors.push(`${this.fieldLabel} must be an array`);
    } else {
      const validOptions = this.options.map(opt => opt.value);
      const invalidValues = value.filter(v => !validOptions.includes(v));
      if (invalidValues.length > 0) {
        errors.push(`${this.fieldLabel} contains invalid values: ${invalidValues.join(', ')}`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
};

// Static method to get fields for an entity
customFieldSchema.statics.getFieldsForEntity = async function(tenantId, entityType) {
  return this.find({
    tenant: tenantId,
    entityType: entityType,
    isActive: true,
    'ui.isVisible': true
  }).sort({ 'ui.order': 1 });
};

// Static method to validate all custom fields for an entity
customFieldSchema.statics.validateEntityData = async function(tenantId, entityType, data) {
  const fields = await this.getFieldsForEntity(tenantId, entityType);
  const errors = [];
  
  for (const field of fields) {
    const value = data[field.fieldName];
    const result = field.validateValue(value);
    
    if (!result.valid) {
      errors.push(...result.errors);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
};

const CustomField = mongoose.model('CustomField', customFieldSchema);

export default CustomField;
