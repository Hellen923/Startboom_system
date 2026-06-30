import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  // Personal Information
  name: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say', ''],
    default: ''
  },
  nin: {
    type: String,
    trim: true
  },
  idType: {
    type: String,
    enum: ['passport', 'national_id', 'drivers_license', 'other'],
    default: 'national_id'
  },
  
  // Contact Information
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  address: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: ''
  },
  state: {
    type: String,
    default: ''
  },
  postalCode: {
    type: String,
    default: ''
  },
  country: {
    type: String,
    default: ''
  },
  
  // Company/Professional Info
  company: {
    type: String,
    default: ''
  },
  position: {
    type: String,
    default: ''
  },
  industry: {
    type: String,
    default: ''
  },
  
  // Emergency Contact
  emergencyContact: {
    name: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    },
    relationship: {
      type: String,
      default: ''
    }
  },
  
  // CRM-Specific Fields
  status: {
    type: String,
    enum: ['prospect', 'active', 'vip', 'inactive'],
    default: 'prospect'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  engagementScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  tags: {
    type: [String],
    default: []
  },
  notes: {
    type: String,
    default: ''
  },
  // Interaction history (calls, emails, meetings, tickets)
  interactions: {
    type: [
      {
        type: {
          type: String,
          enum: ['call', 'email', 'meeting', 'ticket', 'other'],
          default: 'other'
        },
        date: { type: Date, default: Date.now },
        notes: { type: String, default: '' },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
      }
    ],
    default: []
  },
  // Attachments/documents linked to the client
  attachments: {
    type: [
      {
        filename: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
      }
    ],
    default: []
  },
  // Upcoming tasks / follow-ups
  tasks: {
    type: [
      {
        title: String,
        subject: { type: String, default: 'Call', enum: ['Call', 'Support', 'Follow-up', 'Meeting', 'Review', 'Other'] },
        description: { type: String, default: '' },
        dueDate: Date,
        dueTime: String,
        status: { type: String, default: 'pending', enum: ['pending', 'in_progress', 'completed', 'waiting', 'deferred'] },
        priority: { type: String, default: 'Medium', enum: ['Low', 'Medium', 'Critical'] },
        completed: { type: Boolean, default: false },
        contactPerson: { type: String, default: '' },
        assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
        // Reminder tracking — prevents duplicate reminder emails/notifications
        reminderSent: { type: Boolean, default: false },
        overdueSent:  { type: Boolean, default: false }
      }
    ],
    default: []
  },
  // Associated deals
  deals: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Deal' }],
    default: []
  },
  // Assigned agents (supporting multiple agents)
  assignedAgents: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    default: []
  },
  // Last contact summary
  lastContact: {
    date: Date,
    type: { type: String, enum: ['call', 'email', 'meeting', 'ticket', 'other'] }
  },
  
  // Activity Tracking (for dormant/active classification)
  lastPurchaseDate: {
    type: Date
  },
  totalPurchases: {
    type: Number,
    default: 0,
    min: 0
  },
  lifetimeValue: {
    type: Number,
    default: 0,
    min: 0
  },
  isDormant: {
    type: Boolean,
    default: false,
    index: true
  },
  dormantSince: {
    type: Date
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Agent is required']
  },
  
  // Multi-Tenant Field
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant is required']
  },
  
  // Contact Persons
  contacts: {
    type: [{
      name: String,
      position: { type: String, default: '' },
      email:    { type: String, default: '' },
      phone:    { type: String, default: '' },
      birthday: { type: Date,   default: null },
      reportingLine: { type: String, default: '' },
      isPrimary: { type: Boolean, default: false }
    }],
    default: []
  },

  // Lead-specific fields (used when status = prospect)
  contactName: { type: String, default: '' },
  telephone:   { type: String, default: '' },
  companyName: { type: String, default: '' },
  companyEmail:{ type: String, default: '' },
  leadStatus: {
    type: String,
    enum: ['New', 'Contacted', 'Unqualified', 'Qualified', 'Converted', ''],
    default: 'New'
  },
  rating: {
    type: String,
    enum: ['Cold', 'Warm', 'Hot', ''],
    default: 'Cold'
  }
}, {
  timestamps: true
});

// Add indexes for faster queries
clientSchema.index({ agent: 1 }); // Fast agent lookups
clientSchema.index({ email: 1 }); // Fast email lookups
clientSchema.index({ status: 1 }); // Fast status filtering
clientSchema.index({ createdAt: -1 }); // Fast date-based sorting
clientSchema.index({ tenant: 1 }); // Fast tenant-based filtering
clientSchema.index({ tenant: 1, agent: 1 }); // Compound index for tenant + agent queries

// Activity tracking methods
clientSchema.methods.updateActivity = function(purchaseAmount = 0) {
  this.lastPurchaseDate = new Date();
  if (purchaseAmount > 0) {
    this.totalPurchases += 1;
    this.lifetimeValue += purchaseAmount;
  }
  this.isDormant = false;
  this.dormantSince = null;
  return this.save();
};

clientSchema.methods.markAsDormant = function() {
  this.isDormant = true;
  this.dormantSince = new Date();
  return this.save();
};

// Static method to identify dormant clients (no purchase in 90 days)
clientSchema.statics.findDormant = function(tenant, daysInactive = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysInactive);
  
  return this.find({
    tenant,
    status: 'active',
    $or: [
      { lastPurchaseDate: { $lt: cutoffDate } },
      { lastPurchaseDate: { $exists: false }, createdAt: { $lt: cutoffDate } }
    ]
  });
};

clientSchema.statics.findActive = function(tenant, daysActive = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysActive);
  
  return this.find({
    tenant,
    status: 'active',
    lastPurchaseDate: { $gte: cutoffDate }
  });
};

export default mongoose.model('Client', clientSchema);
