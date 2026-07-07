// models/Team.js
import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
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
  
  name: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true
  },
  
  description: {
    type: String,
    default: '',
    trim: true
  },
  
  // Team manager/lead
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Team members
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['lead', 'member'],
      default: 'member'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // Team targets/goals
  targets: {
    revenue: Number,
    deals: Number,
    clients: Number
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Team performance stats
  stats: {
    totalMembers: {
      type: Number,
      default: 0
    },
    activeMembers: {
      type: Number,
      default: 0
    },
    totalClients: {
      type: Number,
      default: 0
    },
    totalDeals: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    lastUpdated: Date
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
teamSchema.index({ tenant: 1, department: 1 });
teamSchema.index({ tenant: 1, name: 1 }, { unique: true }); // Unique name per tenant
teamSchema.index({ 'members.user': 1 });

// Update member count before saving
teamSchema.pre('save', function(next) {
  this.stats.totalMembers = this.members.length;
  this.stats.activeMembers = this.members.filter(m => m.isActive).length;
  next();
});

// Method to add member
teamSchema.methods.addMember = function(userId, role = 'member') {
  const existingMember = this.members.find(
    m => m.user.toString() === userId.toString()
  );
  
  if (existingMember) {
    existingMember.isActive = true;
    existingMember.joinedAt = new Date();
    existingMember.role = role;
  } else {
    this.members.push({
      user: userId,
      role: role,
      joinedAt: new Date(),
      isActive: true
    });
  }
  
  return this.save();
};

// Method to remove member
teamSchema.methods.removeMember = function(userId) {
  const member = this.members.find(
    m => m.user.toString() === userId.toString()
  );
  
  if (member) {
    member.isActive = false;
  }
  
  return this.save();
};

// Method to get active members
teamSchema.methods.getActiveMembers = function() {
  return this.members.filter(m => m.isActive);
};

// Method to check if user is in team
teamSchema.methods.hasMember = function(userId) {
  return this.members.some(
    m => m.user.toString() === userId.toString() && m.isActive
  );
};

// Static method to get user's teams
teamSchema.statics.getUserTeams = async function(tenantId, userId) {
  return this.find({
    tenant: tenantId,
    'members.user': userId,
    'members.isActive': true,
    isActive: true
  }).populate('department manager');
};

const Team = mongoose.model('Team', teamSchema);

export default Team;
