// models/Goal.js
import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant is required'],
    index: true
  },
  
  name: {
    type: String,
    required: [true, 'Goal name is required'],
    trim: true
  },
  
  description: {
    type: String,
    default: '',
    trim: true
  },
  
  // Goal type - what are we measuring?
  type: {
    type: String,
    required: [true, 'Goal type is required'],
    enum: [
      'revenue', 'deals', 'clients', 'sales_volume',
      'calls', 'meetings', 'emails', 'activities',
      'conversion_rate', 'average_deal_size', 
      'customer_satisfaction', 'retention_rate',
      'custom' // For any other metric
    ],
    index: true
  },
  
  // Custom metric name (if type is 'custom')
  customMetricName: {
    type: String,
    trim: true
  },
  
  // Who is this goal for?
  assignmentType: {
    type: String,
    required: true,
    enum: ['company', 'branch', 'department', 'team', 'individual'],
    index: true
  },
  
  // Assignment references
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    index: true
  },
  
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    index: true
  },
  
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    index: true
  },
  
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  // Time period
  period: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'],
    default: 'monthly'
  },
  
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  
  endDate: {
    type: Date,
    required: true,
    index: true
  },
  
  // Target and actual values
  target: {
    type: Number,
    required: [true, 'Target value is required'],
    min: 0
  },
  
  actual: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Unit of measurement
  unit: {
    type: String,
    enum: ['currency', 'number', 'percentage', 'hours', 'days'],
    default: 'number'
  },
  
  // Currency (if unit is currency)
  currency: {
    type: String,
    default: 'USD'
  },
  
  // Progress tracking
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  status: {
    type: String,
    enum: ['not_started', 'on_track', 'at_risk', 'behind', 'completed', 'failed'],
    default: 'not_started',
    index: true
  },
  
  // Milestones/checkpoints
  milestones: [{
    date: Date,
    targetValue: Number,
    actualValue: Number,
    achieved: { type: Boolean, default: false },
    note: String
  }],
  
  // Parent goal (for cascading goals)
  parentGoal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    default: null
  },
  
  // Child goals (auto-populated)
  childGoals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal'
  }],
  
  // Weighting (if part of a composite goal)
  weight: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  
  // Auto-update settings
  autoUpdate: {
    enabled: { type: Boolean, default: true },
    frequency: { type: String, enum: ['hourly', 'daily', 'weekly'], default: 'daily' },
    lastUpdated: Date
  },
  
  // Notifications
  notifications: {
    enabled: { type: Boolean, default: true },
    notifyOn: {
      milestone: { type: Boolean, default: true },
      atRisk: { type: Boolean, default: true },
      completed: { type: Boolean, default: true },
      failed: { type: Boolean, default: true }
    },
    recipients: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  
  // Completion tracking
  completedAt: {
    type: Date,
    default: null
  },
  
  achievementPercentage: {
    type: Number,
    default: 0
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
goalSchema.index({ tenant: 1, assignmentType: 1, status: 1 });
goalSchema.index({ tenant: 1, user: 1, startDate: 1, endDate: 1 });
goalSchema.index({ tenant: 1, team: 1, period: 1 });
goalSchema.index({ tenant: 1, department: 1, period: 1 });
goalSchema.index({ startDate: 1, endDate: 1 });

// Update progress and status before saving
goalSchema.pre('save', function(next) {
  // Calculate progress percentage
  if (this.target > 0) {
    this.progress = Math.min(100, Math.round((this.actual / this.target) * 100));
    this.achievementPercentage = (this.actual / this.target) * 100;
  }
  
  // Update status based on progress and time
  const now = new Date();
  const totalTime = this.endDate - this.startDate;
  const elapsed = now - this.startDate;
  const timeProgress = (elapsed / totalTime) * 100;
  
  if (this.progress >= 100) {
    this.status = 'completed';
    if (!this.completedAt) {
      this.completedAt = now;
    }
  } else if (now > this.endDate) {
    this.status = 'failed';
  } else if (this.progress === 0) {
    this.status = 'not_started';
  } else if (this.progress >= timeProgress - 10) {
    this.status = 'on_track';
  } else if (this.progress >= timeProgress - 25) {
    this.status = 'at_risk';
  } else {
    this.status = 'behind';
  }
  
  next();
});

// Method to update actual value
goalSchema.methods.updateActual = function(value) {
  this.actual = value;
  this.autoUpdate.lastUpdated = new Date();
  return this.save();
};

// Method to add progress
goalSchema.methods.addProgress = function(value) {
  this.actual += value;
  this.autoUpdate.lastUpdated = new Date();
  return this.save();
};

// Method to check milestone achievement
goalSchema.methods.checkMilestones = function() {
  const now = new Date();
  let updated = false;
  
  this.milestones.forEach(milestone => {
    if (now >= milestone.date && !milestone.achieved) {
      milestone.actualValue = this.actual;
      milestone.achieved = this.actual >= milestone.targetValue;
      updated = true;
    }
  });
  
  if (updated) {
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to get active goals for user
goalSchema.statics.getUserGoals = async function(userId, period = null) {
  const query = {
    user: userId,
    isActive: true,
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() }
  };
  
  if (period) {
    query.period = period;
  }
  
  return this.find(query).sort({ startDate: -1 });
};

// Static method to get team goals
goalSchema.statics.getTeamGoals = async function(teamId, period = null) {
  const query = {
    team: teamId,
    isActive: true,
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() }
  };
  
  if (period) {
    query.period = period;
  }
  
  return this.find(query).sort({ startDate: -1 });
};

// Static method to cascade goals (split parent goal to children)
goalSchema.statics.cascadeGoal = async function(parentGoalId, childAssignments) {
  const parentGoal = await this.findById(parentGoalId);
  if (!parentGoal) throw new Error('Parent goal not found');
  
  const childGoals = [];
  
  for (const assignment of childAssignments) {
    const childGoal = new this({
      tenant: parentGoal.tenant,
      name: assignment.name || parentGoal.name,
      type: parentGoal.type,
      assignmentType: assignment.assignmentType,
      [assignment.assignmentType]: assignment.assignmentId,
      period: parentGoal.period,
      startDate: parentGoal.startDate,
      endDate: parentGoal.endDate,
      target: assignment.target,
      unit: parentGoal.unit,
      currency: parentGoal.currency,
      parentGoal: parentGoal._id,
      weight: assignment.weight || 100,
      createdBy: parentGoal.createdBy
    });
    
    await childGoal.save();
    childGoals.push(childGoal);
  }
  
  // Update parent with child references
  parentGoal.childGoals = childGoals.map(g => g._id);
  await parentGoal.save();
  
  return childGoals;
};

// Static method to get goal hierarchy
goalSchema.statics.getGoalHierarchy = async function(goalId) {
  const goal = await this.findById(goalId)
    .populate('childGoals')
    .populate('parentGoal');
  
  if (!goal) return null;
  
  // Recursively load all descendants
  if (goal.childGoals && goal.childGoals.length > 0) {
    for (let i = 0; i < goal.childGoals.length; i++) {
      goal.childGoals[i] = await this.getGoalHierarchy(goal.childGoals[i]._id);
    }
  }
  
  return goal;
};

const Goal = mongoose.model('Goal', goalSchema);

export default Goal;
