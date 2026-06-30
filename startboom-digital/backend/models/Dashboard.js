import mongoose from 'mongoose';

const dashboardSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  layout: {
    type: Object,
    default: {}
  },
  widgets: [{
    id: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['kpi', 'chart', 'table', 'metric', 'progress'],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    config: {
      type: Object,
      default: {}
    },
    position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      w: { type: Number, default: 4 },
      h: { type: Number, default: 3 }
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  filters: {
    dateRange: {
      start: Date,
      end: Date
    },
    agents: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    status: [String],
    priority: [String]
  }
}, {
  timestamps: true
});

// Ensure only one default dashboard per user
dashboardSchema.index({ user: 1, isDefault: 1 }, {
  unique: true,
  partialFilterExpression: { isDefault: true }
});

export default mongoose.model('Dashboard', dashboardSchema);