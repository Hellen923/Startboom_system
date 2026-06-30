// models/Notification.js
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: [
      'deal_created', 'deal_updated', 'deal_won', 'deal_lost',
      'client_created', 'client_updated',
      'meeting_created', 'meeting_completed', 'meeting_response',
      'meeting_reminder', 'meeting_scheduled',
      'sale_created', 'document_uploaded',
      'task_due', 'task_overdue',
      'announcement'
    ],
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // Admin user ID
  },
  
  // Multi-Tenant Field
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant is required']
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // Agent who performed the action
  },
  entityType: {
    type: String,
    enum: ['deal', 'Deal', 'client', 'Client', 'meeting', 'sale', 'Sale', 'document', 'Schedule', 'User', 'task', 'Tenant', 'System'],
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'entityType'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
