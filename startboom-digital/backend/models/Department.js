// models/Department.js
import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant is required'],
    index: true
  },
  
  name: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true
  },
  
  description: {
    type: String,
    default: '',
    trim: true
  },
  
  // Modules this department has access to
  modules: [{
    type: String,
    enum: [
      'clients', 'deals', 'sales', 'products', 'territories',
      'meetings', 'schedules', 'analytics', 'reports',
      'finance', 'hr', 'marketing', 'support', 'inventory'
    ]
  }],
  
  icon: {
    type: String,
    default: 'Briefcase' // Lucide icon name
  },
  
  color: {
    type: String,
    default: '#0066FF' // Hex color for visual identification
  },
  
  // Department head/manager
  head: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Stats for quick access
  stats: {
    totalUsers: {
      type: Number,
      default: 0
    },
    totalTeams: {
      type: Number,
      default: 0
    }
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

// Indexes for performance
departmentSchema.index({ tenant: 1, name: 1 }, { unique: true }); // Unique name per tenant
departmentSchema.index({ tenant: 1, isActive: 1 });

// Virtual for populated head info
departmentSchema.virtual('headInfo', {
  ref: 'User',
  localField: 'head',
  foreignField: '_id',
  justOne: true
});

// Method to check if module is enabled
departmentSchema.methods.hasModule = function(moduleName) {
  return this.modules.includes(moduleName);
};

// Method to add module
departmentSchema.methods.addModule = function(moduleName) {
  if (!this.modules.includes(moduleName)) {
    this.modules.push(moduleName);
    return this.save();
  }
  return this;
};

// Method to remove module
departmentSchema.methods.removeModule = function(moduleName) {
  this.modules = this.modules.filter(m => m !== moduleName);
  return this.save();
};

// Static method to get departments with user count
departmentSchema.statics.getWithStats = async function(tenantId) {
  const User = mongoose.model('User');
  const Team = mongoose.model('Team');
  
  const departments = await this.find({ tenant: tenantId, isActive: true });
  
  for (let dept of departments) {
    const userCount = await User.countDocuments({ 
      tenant: tenantId, 
      department: dept._id 
    });
    const teamCount = await Team.countDocuments({ 
      tenant: tenantId, 
      department: dept._id 
    });
    
    dept.stats.totalUsers = userCount;
    dept.stats.totalTeams = teamCount;
  }
  
  return departments;
};

const Department = mongoose.model('Department', departmentSchema);

export default Department;
