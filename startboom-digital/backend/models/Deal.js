// models/Deal.js
import mongoose from 'mongoose';

const dealSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  value: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  exchangeRate: {
    type: Number,
    default: 1
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Multi-Tenant Field
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant is required']
  },
  teamMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  stage: {
    type: String,
    enum: ['lead', 'qualification', 'proposal', 'negotiation', 'won', 'lost'],
    default: 'lead'
  },
  dealType: {
    type: String,
    enum: ['new', 'existing'],
    default: 'new'
  },
  probability: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  expectedCloseDate: Date,
  lastActivityDate: {
    type: Date,
    default: Date.now
  },
  closedAt: Date,
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  notes: [{
    content: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  documents: [{
    filename: String,
    originalName: String,
    fileType: String,
    fileSize: Number,
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tasks: [{
    title: String,
    description: String,
    dueDate: Date,
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  activities: [{
    type: {
      type: String,
      enum: ['call', 'email', 'meeting', 'note', 'document_upload']
    },
    description: String,
    date: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Update last activity date when deal is modified
dealSchema.pre('save', function(next) {
  this.lastActivityDate = new Date();
  next();
});

// Add indexes for better performance
dealSchema.index({ agent: 1 });
dealSchema.index({ client: 1 });
dealSchema.index({ stage: 1 });
dealSchema.index({ tenant: 1 });
dealSchema.index({ tenant: 1, agent: 1 });
dealSchema.index({ tenant: 1, stage: 1 });
dealSchema.index({ expectedCloseDate: 1 });
dealSchema.index({ lastActivityDate: -1 });

export default mongoose.model('Deal', dealSchema);