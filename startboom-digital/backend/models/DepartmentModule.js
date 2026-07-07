// models/DepartmentModule.js
import mongoose from 'mongoose';

const departmentModuleSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant is required'],
    index: true
  },
  
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required'],
    index: true
  },
  
  // Which module this is
  module: {
    type: String,
    required: [true, 'Module name is required'],
    enum: [
      'clients', 'deals', 'sales', 'products', 'territories',
      'meetings', 'schedules', 'analytics', 'reports',
      'finance', 'invoices', 'payments', 'expenses',
      'hr', 'employees', 'payroll', 'recruitment',
      'marketing', 'campaigns', 'emails',
      'support', 'tickets', 'knowledge_base',
      'inventory', 'warehouses', 'stock',
      'projects', 'tasks', 'timesheets',
      'users', 'settings', 'audit_logs'
    ]
  },
  
  // Is this module enabled for this department?
  isEnabled: {
    type: Boolean,
    default: true
  },
  
  // Access level for this module
  accessLevel: {
    type: String,
    enum: ['full', 'read_only', 'limited', 'custom'],
    default: 'full'
  },
  
  // Custom permissions for this department-module combination
  // Overrides default role permissions
  customPermissions: {
    view: { type: Boolean, default: true },
    create: { type: Boolean, default: true },
    edit: { type: Boolean, default: true },
    delete: { type: Boolean, default: false },
    export: { type: Boolean, default: false },
    import: { type: Boolean, default: false },
    approve: { type: Boolean, default: false }
  },
  
  // Module-specific settings
  settings: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
    // Example for sales module: { requireApproval: true, maxDiscountPercent: 10 }
  },
  
  // Who can assign/manage this module for the department
  managedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
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

// Compound unique index: one record per department-module combination
departmentModuleSchema.index({ tenant: 1, department: 1, module: 1 }, { unique: true });
departmentModuleSchema.index({ tenant: 1, isEnabled: 1 });

// Method to check if department has access to module
departmentModuleSchema.statics.hasAccess = async function(departmentId, moduleName) {
  const access = await this.findOne({
    department: departmentId,
    module: moduleName,
    isEnabled: true,
    isActive: true
  });
  
  return !!access;
};

// Method to get all modules for a department
departmentModuleSchema.statics.getDepartmentModules = async function(departmentId) {
  return this.find({
    department: departmentId,
    isEnabled: true,
    isActive: true
  }).sort({ module: 1 });
};

// Method to get departments that have access to a module
departmentModuleSchema.statics.getDepartmentsWithModule = async function(tenantId, moduleName) {
  const records = await this.find({
    tenant: tenantId,
    module: moduleName,
    isEnabled: true,
    isActive: true
  }).populate('department', 'name');
  
  return records.map(r => r.department);
};

// Method to bulk assign modules to department
departmentModuleSchema.statics.bulkAssign = async function(departmentId, tenantId, modules, createdBy) {
  const operations = modules.map(module => ({
    updateOne: {
      filter: { tenant: tenantId, department: departmentId, module: module },
      update: { 
        $set: { 
          isEnabled: true,
          isActive: true,
          updatedBy: createdBy 
        },
        $setOnInsert: { 
          tenant: tenantId,
          department: departmentId,
          module: module,
          createdBy: createdBy 
        }
      },
      upsert: true
    }
  }));
  
  return this.bulkWrite(operations);
};

const DepartmentModule = mongoose.model('DepartmentModule', departmentModuleSchema);

export default DepartmentModule;
