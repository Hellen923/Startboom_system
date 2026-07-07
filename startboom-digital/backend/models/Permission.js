// models/Permission.js
import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant is required'],
    index: true
  },
  
  // What role does this permission apply to?
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'manager', 'agent', 'finance_staff', 'hr_staff', 'support_staff', 'custom'],
    required: [true, 'Role is required']
  },
  
  // Optional: Department-specific permission
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null
  },
  
  // Which module/resource does this permission control?
  module: {
    type: String,
    required: [true, 'Module is required'],
    enum: [
      'clients', 'deals', 'sales', 'products', 'territories',
      'meetings', 'schedules', 'analytics', 'reports',
      'finance', 'hr', 'marketing', 'support', 'inventory',
      'users', 'settings', 'audit_logs'
    ]
  },
  
  // What actions can this role perform on this module?
  actions: {
    view: {
      type: Boolean,
      default: false
    },
    create: {
      type: Boolean,
      default: false
    },
    edit: {
      type: Boolean,
      default: false
    },
    delete: {
      type: Boolean,
      default: false
    },
    export: {
      type: Boolean,
      default: false
    },
    import: {
      type: Boolean,
      default: false
    },
    // Special scope permissions (5-level hierarchy)
    viewAll: {
      type: Boolean,
      default: false // Can see all records in the entire company
    },
    viewBranch: {
      type: Boolean,
      default: false // Can see all records in their branch
    },
    viewDepartment: {
      type: Boolean,
      default: false // Can see all records in their department
    },
    viewTeam: {
      type: Boolean,
      default: false // Can see team records
    },
    viewOwn: {
      type: Boolean,
      default: true // Can see only their own records
    },
    // Special actions
    approve: {
      type: Boolean,
      default: false // Can approve workflows
    },
    assignOwnership: {
      type: Boolean,
      default: false // Can reassign records to others
    }
  },
  
  // Custom restrictions (JSON format for flexibility)
  restrictions: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
    // Example: { maxDealValue: 100000, canApproveUpTo: 50000 }
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  description: {
    type: String,
    default: ''
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

// Compound index for fast permission lookup
permissionSchema.index({ tenant: 1, role: 1, module: 1 }, { unique: true });
permissionSchema.index({ tenant: 1, department: 1, role: 1 });
permissionSchema.index({ isActive: 1 });

// Method to check if action is allowed
permissionSchema.methods.can = function(action) {
  return this.actions[action] === true;
};

// Method to get scope level (who can see what)
permissionSchema.methods.getScopeLevel = function() {
  if (this.actions.viewAll) return 'all';
  if (this.actions.viewBranch) return 'branch';
  if (this.actions.viewDepartment) return 'department';
  if (this.actions.viewTeam) return 'team';
  if (this.actions.viewOwn) return 'own';
  return 'none';
};

// Static method to get user's permissions
permissionSchema.statics.getUserPermissions = async function(user) {
  const query = {
    tenant: user.tenant,
    role: user.role,
    isActive: true
  };
  
  // If user has a department, also fetch department-specific permissions
  const permissions = await this.find({
    $or: [
      { ...query, department: null }, // Global permissions for role
      { ...query, department: user.department } // Department-specific
    ]
  });
  
  // Convert to easier-to-use object
  const permissionMap = {};
  
  permissions.forEach(perm => {
    if (!permissionMap[perm.module]) {
      permissionMap[perm.module] = perm.actions;
    } else {
      // Merge permissions (department-specific can override global)
      permissionMap[perm.module] = {
        ...permissionMap[perm.module],
        ...perm.actions
      };
    }
  });
  
  return permissionMap;
};

// Static method to check if user can perform action on module
permissionSchema.statics.userCan = async function(user, module, action) {
  const permission = await this.findOne({
    tenant: user.tenant,
    role: user.role,
    module: module,
    isActive: true,
    $or: [
      { department: null },
      { department: user.department }
    ]
  });
  
  if (!permission) return false;
  
  return permission.actions[action] === true;
};

const Permission = mongoose.model('Permission', permissionSchema);

export default Permission;
