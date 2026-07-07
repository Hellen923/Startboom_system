import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    required: true
  },

   role: {
     type: String,
     enum: ['superadmin', 'admin', 'manager', 'agent'],
     default: 'agent'
   },
   customRole: {
     type: mongoose.Schema.Types.ObjectId,
     ref: 'Role',
     default: null
   },

   // Target fields for performance tracking
   monthlyTargetDeals: {
     type: Number,
     default: 0
   },
   monthlyTargetAmount: {
     type: Number,
     default: 0
   },
   monthlyTargetClients: {
     type: Number,
     default: 0
   },

  nin: {
    type: String,
    trim: true,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['online', 'offline'],
    default: 'offline'
  },
  isFirstLogin: {
    type: Boolean,
    default: true
  },
  otp: {
    type: String,
    default: null
  },
  otpExpires: {
    type: Date,
    default: null
  },
  profileImage: {
    type: String,
    default: null
  },
  performanceScore: {
    type: Number,
    default: 0
  },
  totalDeals: {
    type: Number,
    default: 0
  },
  successfulDeals: {
    type: Number,
    default: 0
  },
  failedDeals: {
    type: Number,
    default: 0
  },
  totalSales: {
    type: Number,
    default: 0
  },
  totalSalesAmount: {
    type: Number,
    default: 0
  },
   monthlySales: {
     type: Number,
     default: 0
   },
   monthlySalesAmount: {
     type: Number,
     default: 0
   },
   monthlyClients: {
     type: Number,
     default: 0
   },
   monthlyTargetDeals: {
     type: Number,
     default: 0
   },
   monthlyTargetAmount: {
     type: Number,
     default: 0
   },
   monthlyTargetClients: {
     type: Number,
     default: 0
   },
  monthlySalesAmount: {
    type: Number,
    default: 0
  },
  agentRank: {
    type: Number,
    default: 0
  },
  lastRankUpdate: {
    type: Date,
    default: Date.now
  },
  
  // Multi-Tenant Fields
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    default: null // null for superadmin users
  },

  // Department & Team (NEW: ObjectId references)
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null,
    index: true
  },
  
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null,
    index: true
  },
  
  // Branch/Office location (ObjectId reference)
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null,
    index: true
  },
  
  // Legacy department field (keeping for backward compatibility)
  departmentLegacy: {
    type: String,
    default: ''
  },
  
  // Commission & target tracking
  commissionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  commissionEarned: {
    type: Number,
    default: 0
  },
  
  region: {
    type: String,
    default: ''
  },
  
  // Last login tracking
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Indexes for performance
userSchema.index({ tenant: 1, role: 1, isActive: 1 });
userSchema.index({ tenant: 1, createdAt: -1 });
userSchema.index({ status: 1 });
userSchema.index({ tenant: 1, department: 1 });
userSchema.index({ tenant: 1, team: 1 });
userSchema.index({ tenant: 1, branch: 1 });
userSchema.index({ tenant: 1, department: 1, team: 1 });
userSchema.index({ tenant: 1, branch: 1, department: 1 });

export default mongoose.model('User', userSchema);
