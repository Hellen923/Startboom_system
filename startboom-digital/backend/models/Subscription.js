import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  // Subscription Plan Details
  planName: {
    type: String,
    required: [true, 'Plan name is required'],
    enum: ['starter', 'professional', 'enterprise', 'custom'],
    default: 'starter'
  },
  
  planDisplayName: {
    type: String,
    required: [true, 'Plan display name is required']
  },
  
  // Pricing Information
  pricing: {
    amount: {
      type: Number,
      required: [true, 'Subscription amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      default: 'USD',
      uppercase: true
    },
    interval: {
      type: String,
      enum: ['monthly', 'yearly', 'lifetime'],
      required: [true, 'Billing interval is required'],
      default: 'monthly'
    }
  },
  
  // Feature Access Control
  features: {
    // User Limits
    maxUsers: {
      type: Number,
      default: 250,
      min: [1, 'Must allow at least 1 user']
    },
    
    // Data Limits
    maxClients: {
      type: Number,
      default: 100,
      min: [1, 'Must allow at least 1 client']
    },
    
    maxDeals: {
      type: Number,
      default: 50,
      min: [1, 'Must allow at least 1 deal']
    },
    
    maxStorage: {
      type: Number, // in MB
      default: 1000, // 1GB
      min: [100, 'Must allow at least 100MB storage']
    },
    
    // Advanced Features
    advancedReports: {
      type: Boolean,
      default: false
    },
    
    apiAccess: {
      type: Boolean,
      default: false
    },
    
    customBranding: {
      type: Boolean,
      default: false
    },
    
    bulkOperations: {
      type: Boolean,
      default: false
    },
    
    emailIntegration: {
      type: Boolean,
      default: true
    },
    
    mobileApp: {
      type: Boolean,
      default: true
    },
    
    prioritySupport: {
      type: Boolean,
      default: false
    },
    
    dataExport: {
      type: Boolean,
      default: true
    },
    
    auditLogs: {
      type: Boolean,
      default: false
    },
    
    ssoIntegration: {
      type: Boolean,
      default: false
    }
  },
  
  // Subscription Status
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'suspended', 'trial'],
    default: 'trial'
  },
  
  // Billing Cycle Information
  billing: {
    currentPeriodStart: {
      type: Date,
      default: Date.now
    },
    
    currentPeriodEnd: {
      type: Date,
      default: function() {
        const now = new Date();
        if (this.pricing.interval === 'monthly') {
          return new Date(now.setMonth(now.getMonth() + 1));
        } else if (this.pricing.interval === 'yearly') {
          return new Date(now.setFullYear(now.getFullYear() + 1));
        }
        return new Date(now.setFullYear(now.getFullYear() + 100)); // Lifetime
      }
    },
    
    nextBillingDate: {
      type: Date,
      default: function() {
        return this.billing?.currentPeriodEnd || new Date();
      }
    },
    
    lastPaymentDate: {
      type: Date,
      default: null
    },
    
    lastPaymentAmount: {
      type: Number,
      default: 0
    }
  },
  
  // Payment Information (for reference only - sensitive data should be in payment processor)
  payment: {
    method: {
      type: String,
      enum: ['credit_card', 'bank_transfer', 'paypal', 'stripe', 'manual', ''],
      default: ''
    },
    
    lastFourDigits: {
      type: String,
      default: ''
    },
    
    externalSubscriptionId: {
      type: String, // Stripe subscription ID, PayPal subscription ID, etc.
      default: ''
    },
    
    externalCustomerId: {
      type: String, // Stripe customer ID, PayPal customer ID, etc.
      default: ''
    }
  },
  
  // Trial Information
  trial: {
    isActive: {
      type: Boolean,
      default: false
    },
    
    startDate: {
      type: Date,
      default: null
    },
    
    endDate: {
      type: Date,
      default: null
    },
    
    daysRemaining: {
      type: Number,
      default: 0
    }
  },
  
  // Discount/Coupon Information
  discount: {
    code: {
      type: String,
      default: ''
    },
    
    type: {
      type: String,
      enum: ['percentage', 'fixed', ''],
      default: ''
    },
    
    value: {
      type: Number,
      default: 0
    },
    
    expiresAt: {
      type: Date,
      default: null
    }
  },
  
  // Metadata
  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    
    notes: {
      type: String,
      default: ''
    },
    
    tags: [{
      type: String
    }]
  }
}, {
  timestamps: true
});

// Indexes for better performance
subscriptionSchema.index({ planName: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ 'billing.nextBillingDate': 1 });
subscriptionSchema.index({ 'payment.externalSubscriptionId': 1 });

// Virtual for checking if subscription is expired
subscriptionSchema.virtual('isExpired').get(function() {
  return this.status === 'active' && new Date() > this.billing.currentPeriodEnd;
});

// Virtual for days until expiration
subscriptionSchema.virtual('daysUntilExpiration').get(function() {
  if (this.status !== 'active') return 0;
  const now = new Date();
  const endDate = new Date(this.billing.currentPeriodEnd);
  const diffTime = endDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Virtual for monthly recurring revenue (MRR)
subscriptionSchema.virtual('mrr').get(function() {
  if (this.pricing.interval === 'monthly') {
    return this.pricing.amount;
  } else if (this.pricing.interval === 'yearly') {
    return this.pricing.amount / 12;
  }
  return 0; // Lifetime subscriptions don't contribute to MRR
});

// Method to check if a specific feature is enabled
subscriptionSchema.methods.hasFeature = function(featureName) {
  return this.features[featureName] === true;
};

// Method to get feature limit
subscriptionSchema.methods.getFeatureLimit = function(featureName) {
  return this.features[featureName] || 0;
};

// Method to check if subscription allows more of a resource
subscriptionSchema.methods.canAdd = function(resourceType, currentCount) {
  const limit = this.getFeatureLimit(`max${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}`);
  return currentCount < limit;
};

// Method to calculate next billing date
subscriptionSchema.methods.calculateNextBillingDate = function() {
  const currentEnd = new Date(this.billing.currentPeriodEnd);
  
  if (this.pricing.interval === 'monthly') {
    return new Date(currentEnd.setMonth(currentEnd.getMonth() + 1));
  } else if (this.pricing.interval === 'yearly') {
    return new Date(currentEnd.setFullYear(currentEnd.getFullYear() + 1));
  }
  
  return currentEnd; // Lifetime subscriptions don't have next billing
};

// Pre-save middleware to update billing dates
subscriptionSchema.pre('save', function(next) {
  // Update next billing date if current period end changes
  if (this.isModified('billing.currentPeriodEnd')) {
    this.billing.nextBillingDate = this.billing.currentPeriodEnd;
  }
  
  // Update trial days remaining
  if (this.trial.isActive && this.trial.endDate) {
    const now = new Date();
    const endDate = new Date(this.trial.endDate);
    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    this.trial.daysRemaining = Math.max(0, diffDays);
  }
  
  next();
});

export default mongoose.model('Subscription', subscriptionSchema);
