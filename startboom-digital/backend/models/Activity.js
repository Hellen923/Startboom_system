// models/Activity.js
import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant is required'],
    index: true
  },
  
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    index: true
  },
  
  // Activity type
  type: {
    type: String,
    required: true,
    enum: [
      'call', 'email', 'meeting', 'demo', 'presentation',
      'follow_up', 'site_visit', 'negotiation',
      'proposal_sent', 'contract_sent', 'contract_signed',
      'note', 'task_completed', 'deal_created', 'deal_moved',
      'client_created', 'sale_created',
      'custom'
    ],
    index: true
  },
  
  // Custom activity type name
  customTypeName: {
    type: String,
    trim: true
  },
  
  // What entity is this activity related to?
  entityType: {
    type: String,
    enum: ['client', 'deal', 'sale', 'meeting', 'task', 'none'],
    default: 'none'
  },
  
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'entityType'
  },
  
  // Activity details
  title: {
    type: String,
    required: true,
    trim: true
  },
  
  description: {
    type: String,
    default: '',
    trim: true
  },
  
  // Duration in minutes
  duration: {
    type: Number,
    min: 0,
    default: 0
  },
  
  // Outcome/result
  outcome: {
    type: String,
    enum: ['successful', 'unsuccessful', 'pending', 'follow_up_required', 'no_answer', 'none'],
    default: 'none'
  },
  
  // Activity score (for gamification/tracking)
  score: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Was this a high-value activity?
  isHighValue: {
    type: Boolean,
    default: false
  },
  
  // Scheduled vs completed
  scheduledAt: {
    type: Date,
    default: null
  },
  
  completedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Location (for site visits, meetings)
  location: {
    type: String,
    default: ''
  },
  
  // Participants (for meetings, calls)
  participants: [{
    name: String,
    email: String,
    role: String
  }],
  
  // Next steps/follow-up
  nextSteps: {
    type: String,
    default: ''
  },
  
  followUpRequired: {
    type: Boolean,
    default: false
  },
  
  followUpDate: {
    type: Date,
    default: null
  },
  
  // Attachments
  attachments: [{
    filename: String,
    url: String,
    fileType: String
  }],
  
  // Tags for categorization
  tags: [String],
  
  // Metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Access control
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    index: true
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for performance
activitySchema.index({ tenant: 1, user: 1, completedAt: -1 });
activitySchema.index({ tenant: 1, entityType: 1, entityId: 1 });
activitySchema.index({ tenant: 1, type: 1, completedAt: -1 });
activitySchema.index({ tenant: 1, isHighValue: 1, completedAt: -1 });
activitySchema.index({ completedAt: -1 });

// Static method to get activity scores
activitySchema.statics.getActivityScores = function() {
  return {
    'call': 5,
    'email': 2,
    'meeting': 10,
    'demo': 15,
    'presentation': 15,
    'follow_up': 3,
    'site_visit': 20,
    'negotiation': 20,
    'proposal_sent': 10,
    'contract_sent': 15,
    'contract_signed': 25,
    'note': 1,
    'task_completed': 3,
    'deal_created': 5,
    'deal_moved': 2,
    'client_created': 5,
    'sale_created': 10,
    'custom': 5
  };
};

// Calculate score before saving
activitySchema.pre('save', function(next) {
  if (!this.score) {
    const scores = this.constructor.getActivityScores();
    this.score = scores[this.type] || 5;
  }
  
  // Set high-value flag
  const highValueTypes = ['demo', 'presentation', 'site_visit', 'negotiation', 'contract_signed'];
  this.isHighValue = highValueTypes.includes(this.type);
  
  // Set owner if not set
  if (!this.owner) {
    this.owner = this.user;
  }
  
  next();
});

// Static method to get user's activity stats
activitySchema.statics.getUserStats = async function(userId, startDate, endDate) {
  const match = {
    user: userId,
    isActive: true
  };
  
  if (startDate && endDate) {
    match.completedAt = { $gte: startDate, $lte: endDate };
  }
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalActivities: { $sum: 1 },
        totalScore: { $sum: '$score' },
        highValueActivities: {
          $sum: { $cond: ['$isHighValue', 1, 0] }
        },
        totalDuration: { $sum: '$duration' },
        activitiesByType: {
          $push: {
            type: '$type',
            score: '$score'
          }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalActivities: 0,
    totalScore: 0,
    highValueActivities: 0,
    totalDuration: 0
  };
};

// Static method to get activity breakdown by type
activitySchema.statics.getActivityBreakdown = async function(userId, startDate, endDate) {
  const match = {
    user: userId,
    isActive: true
  };
  
  if (startDate && endDate) {
    match.completedAt = { $gte: startDate, $lte: endDate };
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalScore: { $sum: '$score' },
        totalDuration: { $sum: '$duration' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Static method to get team activity summary
activitySchema.statics.getTeamStats = async function(teamId, startDate, endDate) {
  const match = {
    team: teamId,
    isActive: true
  };
  
  if (startDate && endDate) {
    match.completedAt = { $gte: startDate, $lte: endDate };
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$user',
        totalActivities: { $sum: 1 },
        totalScore: { $sum: '$score' },
        highValueActivities: {
          $sum: { $cond: ['$isHighValue', 1, 0] }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        userId: '$_id',
        userName: '$user.name',
        userEmail: '$user.email',
        totalActivities: 1,
        totalScore: 1,
        highValueActivities: 1
      }
    },
    { $sort: { totalScore: -1 } }
  ]);
};

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;
