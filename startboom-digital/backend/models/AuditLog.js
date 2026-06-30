import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN', 'LOGOUT',
      'CREATE_USER', 'UPDATE_USER', 'DELETE_USER',
      'CREATE_CLIENT', 'UPDATE_CLIENT', 'DELETE_CLIENT',
      'CREATE_DEAL', 'UPDATE_DEAL', 'DELETE_DEAL',
      'CREATE_SALE', 'UPDATE_SALE',
      'CREATE_SCHEDULE', 'UPDATE_SCHEDULE', 'DELETE_SCHEDULE',
      'CREATE_MEETING', 'UPDATE_MEETING', 'DELETE_MEETING',
      'UPDATE_SETTINGS', 'CHANGE_PASSWORD',
      'CREATE_TENANT', 'UPDATE_TENANT', 'SUSPEND_TENANT',
      'EXPORT_DATA', 'SET_TARGETS', 'BULK_OPERATION',
      'IMPORT_DATA', 'DELETE_STOCK', 'CREATE_STOCK', 'UPDATE_STOCK',
      'OTHER'
    ]
  },
  description: {
    type: String,
    required: true
  },
  // createdAt is immutable — set once, never changed
  createdAt: {
    type: Date,
    immutable: true,
    default: () => new Date()
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    immutable: true
  },
  userName: {
    type: String,
    default: ''
  },
  userEmail: {
    type: String,
    default: ''
  },
  userRole: {
    type: String,
    default: ''
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    default: null,
    immutable: true
  },
  entityType: {
    type: String,
    default: '' // e.g. 'User', 'Client', 'Deal'
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    immutable: true
  },
  ipAddress: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  // Only allow createdAt — updatedAt would imply mutability
  timestamps: { createdAt: false, updatedAt: false }
});

// ─── IMMUTABILITY GUARDS ──────────────────────────────────────────────────────
// Block any attempt to update an existing audit log document
const IMMUTABILITY_ERROR = 'Audit logs are immutable and cannot be modified.';

auditLogSchema.pre('findOneAndUpdate', function () {
  throw new Error(IMMUTABILITY_ERROR);
});

auditLogSchema.pre('updateOne', function () {
  throw new Error(IMMUTABILITY_ERROR);
});

auditLogSchema.pre('updateMany', function () {
  throw new Error(IMMUTABILITY_ERROR);
});

auditLogSchema.pre('findOneAndDelete', function () {
  throw new Error(IMMUTABILITY_ERROR);
});

auditLogSchema.pre('deleteOne', function () {
  throw new Error(IMMUTABILITY_ERROR);
});

auditLogSchema.pre('deleteMany', function () {
  throw new Error(IMMUTABILITY_ERROR);
});

// ─── INDEXES ─────────────────────────────────────────────────────────────────
auditLogSchema.index({ tenant: 1, createdAt: -1 });
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 }); // for global superadmin queries

export default mongoose.model('AuditLog', auditLogSchema);
