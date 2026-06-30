import mongoose from 'mongoose';

const emailTemplateSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    default: null,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  category: {
    type: String,
    enum: ['client', 'task', 'meeting', 'welcome', 'general'],
    default: 'client'
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  body: {
    type: String,
    required: true,
    maxlength: 10000
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

emailTemplateSchema.index({ tenant: 1, name: 1 }, { unique: true });

export default mongoose.model('EmailTemplate', emailTemplateSchema);
