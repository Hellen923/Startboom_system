// models/Branch.js
import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant is required'],
    index: true
  },
  
  name: {
    type: String,
    required: [true, 'Branch name is required'],
    trim: true
  },
  
  code: {
    type: String,
    trim: true,
    uppercase: true
    // e.g., "KLA" for Kampala, "EBB" for Entebbe
  },
  
  description: {
    type: String,
    default: '',
    trim: true
  },
  
  // Branch type
  type: {
    type: String,
    enum: ['headquarters', 'regional_office', 'branch', 'sales_office', 'warehouse', 'other'],
    default: 'branch'
  },
  
  // Location details
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  
  // Contact information
  contact: {
    phone: String,
    email: String,
    fax: String
  },
  
  // Branch manager/head
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Parent branch (for hierarchical structure)
  parentBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null
  },
  
  // Timezone
  timezone: {
    type: String,
    default: 'Africa/Kampala'
  },
  
  // Currency (can differ from tenant default)
  currency: {
    type: String,
    default: 'UGX'
  },
  
  // Operating hours
  operatingHours: {
    monday: { open: String, close: String, isClosed: Boolean },
    tuesday: { open: String, close: String, isClosed: Boolean },
    wednesday: { open: String, close: String, isClosed: Boolean },
    thursday: { open: String, close: String, isClosed: Boolean },
    friday: { open: String, close: String, isClosed: Boolean },
    saturday: { open: String, close: String, isClosed: Boolean },
    sunday: { open: String, close: String, isClosed: Boolean }
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Branch performance stats
  stats: {
    totalUsers: {
      type: Number,
      default: 0
    },
    totalClients: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    lastUpdated: Date
  },
  
  // Settings specific to this branch
  settings: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
    // Example: { requireApprovalForDiscounts: true, maxDiscountPercent: 15 }
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
branchSchema.index({ tenant: 1, name: 1 }, { unique: true });
branchSchema.index({ tenant: 1, code: 1 });
branchSchema.index({ tenant: 1, isActive: 1 });
branchSchema.index({ parentBranch: 1 });

// Virtual for full address
branchSchema.virtual('fullAddress').get(function() {
  if (!this.address) return '';
  const { street, city, state, country, postalCode } = this.address;
  return [street, city, state, postalCode, country].filter(Boolean).join(', ');
});

// Method to get all child branches
branchSchema.methods.getChildBranches = async function() {
  return this.model('Branch').find({ 
    parentBranch: this._id,
    isActive: true 
  });
};

// Method to get branch hierarchy path
branchSchema.methods.getHierarchyPath = async function() {
  const path = [this];
  let current = this;
  
  while (current.parentBranch) {
    current = await this.model('Branch').findById(current.parentBranch);
    if (current) path.unshift(current);
  }
  
  return path;
};

// Static method to get branch tree
branchSchema.statics.getBranchTree = async function(tenantId, parentId = null) {
  const branches = await this.find({
    tenant: tenantId,
    parentBranch: parentId,
    isActive: true
  }).populate('manager', 'name email');
  
  for (let branch of branches) {
    branch._doc.children = await this.getBranchTree(tenantId, branch._id);
  }
  
  return branches;
};

const Branch = mongoose.model('Branch', branchSchema);

export default Branch;
