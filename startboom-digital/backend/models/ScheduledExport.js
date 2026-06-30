import mongoose from 'mongoose';

const scheduledExportSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  exportType: {
    type: String,
    enum: ['clients', 'deals', 'sales', 'auditLogs'],
    default: 'clients'
  },
  format: {
    type: String,
    enum: ['csv', 'pdf'],
    default: 'csv'
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'weekly'
  },
  recipients: {
    type: [String],
    default: []
  },
  filters: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  },
  nextRunAt: {
    type: Date,
    required: true,
    index: true
  },
  lastRunAt: {
    type: Date,
    default: null
  },
  lastStatus: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
  },
  lastError: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

scheduledExportSchema.index({ tenant: 1, isActive: 1, nextRunAt: 1 });

export default mongoose.model('ScheduledExport', scheduledExportSchema);
