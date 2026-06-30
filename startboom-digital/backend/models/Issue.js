import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema({
  // The client this issue is linked to
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Client is required for an issue']
  },

  // Contact person on the issue (copied from client at creation)
  contactPerson: {
    type: String,
    default: ''
  },

  // Type / reason of the issue
  type: {
    type: String,
    required: [true, 'Issue type is required'],
    enum: ['Bug', 'Complaint', 'Feature Request', 'Billing', 'Technical', 'General'],
    default: 'General'
  },

  // Full description of the issue
  description: {
    type: String,
    required: [true, 'Issue description is required'],
    trim: true
  },

  // Priority
  priority: {
    type: String,
    required: [true, 'Issue priority is required'],
    enum: ['Low', 'Medium', 'Critical'],
    default: 'Medium'
  },

  // Status lifecycle
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: ['New', 'In Progress', 'Done'],
    default: 'New'
  },

  // Resolution notes — populated when status becomes Done
  resolution: {
    type: String,
    default: ''
  },

  // Tracking
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant is required']
  },

  // Created by user
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },

  // Assigned to (support staff)
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

}, {
  timestamps: true
});

// Indexes
issueSchema.index({ tenant: 1, status: 1 });
issueSchema.index({ client: 1 });
issueSchema.index({ type: 1 });
issueSchema.index({ priority: 1 });
issueSchema.index({ createdAt: -1 });
issueSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Issue', issueSchema);
