import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
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
    maxlength: 50
  },
  description: {
    type: String,
    trim: true,
    maxlength: 200,
    default: ''
  },
  permissions: {
    type: [String],
    default: []
  },
  isSystem: {
    type: Boolean,
    default: false // True for default roles that shouldn't be deleted
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Ensure role names are unique within a tenant
roleSchema.index({ tenant: 1, name: 1 }, { unique: true });

export default mongoose.model('Role', roleSchema);
