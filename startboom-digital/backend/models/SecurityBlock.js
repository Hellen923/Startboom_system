import mongoose from 'mongoose';

const securityBlockSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['ip', 'device'],
    required: true
  },
  value: {
    type: String,
    required: true,
    trim: true
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    default: null
  },
  reason: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

securityBlockSchema.index({ type: 1, value: 1, tenant: 1 }, { unique: true });
securityBlockSchema.index({ isActive: 1, createdAt: -1 });

export default mongoose.model('SecurityBlock', securityBlockSchema);
