import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema({
  // Basic Company Information
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  
  // Unique identifier for the tenant (used in URLs, API calls)
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },
  
  // Contact Information
  email: {
    type: String,
    required: [true, 'Company email is required'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  
  phone: {
    type: String,
    trim: true
  },

  // Industry
  industry: {
    type: String,
    default: ''
  },

  // Website
  website: {
    type: String,
    trim: true,
    default: ''
  },
  
  // Company Address
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    country: { type: String, default: '' }
  },
  
  // Tenant Status
  status: {
    type: String,
    enum: ['active', 'suspended', 'inactive', 'trial'],
    default: 'trial'
  },
  
  // Subscription Information (references Subscription model)
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    default: null
  },

  // Branding (separate from settings for easier access)
  branding: {
    logo: { type: String, default: null },
    primaryColor: { type: String, default: '#4F46E5' }, // Indigo default
    secondaryColor: { type: String, default: '#10B981' } // Green default
  },

  // Modules (enable/disable features)
  modules: {
    type: Map,
    of: Boolean,
    default: {
      sales: true,
      deals: true,
      products: true,
      finance: true,
      hr: true,
      projects: true,
      support: true,
      inventory: true,
      marketing: true,
      analytics: true
    }
  },
  
  // Customization Settings
  settings: {
    // Localization
    timezone: { type: String, default: 'UTC' },
    currency: { type: String, default: 'USD' },
    language: { type: String, default: 'en' },
    dateFormat: { type: String, default: 'MM/DD/YYYY' },
    fiscalYearStart: { type: String, default: '01-01' }, // MM-DD format
    
    // Legacy branding (kept for backward compatibility, prefer root-level branding)
    logo: { type: String, default: null },
    primaryColor: { type: String, default: '#f97316' }, // Orange default
    secondaryColor: { type: String, default: '#1f2937' }, // Gray default
    customDomain: { type: String, default: '' }, // e.g. xtreative.crm.com
    
    // Feature Flags (can be overridden by subscription)
    features: {
      maxUsers: { type: Number, default: 250 },
      maxClients: { type: Number, default: 100 },
      maxDeals: { type: Number, default: 50 },
      advancedReports: { type: Boolean, default: false },
      apiAccess: { type: Boolean, default: false },
      customBranding: { type: Boolean, default: false },
      bulkOperations: { type: Boolean, default: false }
    },
    
    // Module Control (Enable/Disable features per tenant)
    modules: {
      type: Map,
      of: {
        enabled: { type: Boolean, default: true },
        icon: { type: String, default: 'Box' }
      },
      default: {
        // Core CRM
        clients: { enabled: true, icon: 'Users' },
        deals: { enabled: true, icon: 'TrendingUp' },
        sales: { enabled: true, icon: 'ShoppingCart' },
        products: { enabled: true, icon: 'Package' },
        territories: { enabled: true, icon: 'Map' },
        meetings: { enabled: true, icon: 'Calendar' },
        schedules: { enabled: true, icon: 'Clock' },
        analytics: { enabled: true, icon: 'BarChart' },
        reports: { enabled: true, icon: 'FileText' },
        dashboards: { enabled: true, icon: 'LayoutDashboard' },
        
        // Premium modules (disabled by default)
        finance: { enabled: false, icon: 'DollarSign' },
        invoices: { enabled: false, icon: 'Receipt' },
        payments: { enabled: false, icon: 'CreditCard' },
        expenses: { enabled: false, icon: 'Wallet' },
        hr: { enabled: false, icon: 'Users' },
        employees: { enabled: false, icon: 'UserCheck' },
        payroll: { enabled: false, icon: 'Banknote' },
        recruitment: { enabled: false, icon: 'UserPlus' },
        marketing: { enabled: false, icon: 'Megaphone' },
        campaigns: { enabled: false, icon: 'Target' },
        emails: { enabled: false, icon: 'Mail' },
        support: { enabled: false, icon: 'Headphones' },
        tickets: { enabled: false, icon: 'Ticket' },
        knowledgeBase: { enabled: false, icon: 'Book' },
        inventory: { enabled: false, icon: 'Warehouse' },
        warehouses: { enabled: false, icon: 'Building' },
        stock: { enabled: false, icon: 'Boxes' },
        projects: { enabled: false, icon: 'Folder' },
        tasks: { enabled: false, icon: 'CheckSquare' },
        timesheets: { enabled: false, icon: 'Timer' },
        users: { enabled: true, icon: 'Users' },
        settings: { enabled: true, icon: 'Settings' },
        auditLogs: { enabled: true, icon: 'FileCheck' }
      }
    },
    
    // Entity Terminology (for customization)
    entityLabels: {
      client: { 
        singular: { type: String, default: 'Client' }, 
        plural: { type: String, default: 'Clients' } 
      },
      deal: { 
        singular: { type: String, default: 'Deal' }, 
        plural: { type: String, default: 'Deals' } 
      },
      sale: { 
        singular: { type: String, default: 'Sale' }, 
        plural: { type: String, default: 'Sales' } 
      },
      product: { 
        singular: { type: String, default: 'Product' }, 
        plural: { type: String, default: 'Products' } 
      },
      meeting: { 
        singular: { type: String, default: 'Meeting' }, 
        plural: { type: String, default: 'Meetings' } 
      }
    }
  },
  
  // Usage Statistics
  usage: {
    totalUsers: { type: Number, default: 0 },
    totalClients: { type: Number, default: 0 },
    totalDeals: { type: Number, default: 0 },
    storageUsed: { type: Number, default: 0 }, // in MB
    lastActivity: { type: Date, default: Date.now }
  },
  
  // Trial Information
  trial: {
    startDate: { type: Date, default: Date.now },
    endDate: { 
      type: Date, 
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days trial
    },
    isActive: { type: Boolean, default: true }
  },
  
  // Owner Information (first admin user)
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Metadata
  metadata: {
    industry: { type: String, default: '' },
    companySize: { 
      type: String, 
      enum: ['1-10', '11-50', '51-200', '201-500', '500+', ''],
      default: ''
    },
    source: { 
      type: String, 
      enum: ['website', 'referral', 'marketing', 'direct', ''],
      default: 'website'
    }
  },

  // Onboarding tracking
  onboarding: {
    completed:    { type: Boolean, default: false },
    currentStep:  { type: Number,  default: 0 },
    // Which steps were completed (not skipped)
    stepsCompleted: {
      branding:     { type: Boolean, default: false },
      localization: { type: Boolean, default: false },
      team:         { type: Boolean, default: false },
      client:       { type: Boolean, default: false }
    },
    completedAt: { type: Date, default: null }
  }
}, {
  timestamps: true
});

// Indexes for better performance
tenantSchema.index({ slug: 1 }, { unique: true });
tenantSchema.index({ email: 1 });
tenantSchema.index({ status: 1 });
tenantSchema.index({ 'trial.endDate': 1 });

// Virtual for checking if trial is expired
tenantSchema.virtual('isTrialExpired').get(function() {
  return this.trial.isActive && new Date() > this.trial.endDate;
});

// Virtual for days remaining in trial
tenantSchema.virtual('trialDaysRemaining').get(function() {
  if (!this.trial.isActive) return 0;
  const now = new Date();
  const endDate = new Date(this.trial.endDate);
  const diffTime = endDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Method to check if a feature is enabled
tenantSchema.methods.hasFeature = function(featureName) {
  // First check subscription features, then fall back to tenant settings
  if (this.subscription && this.subscription.features && this.subscription.features[featureName] !== undefined) {
    return this.subscription.features[featureName];
  }
  return this.settings.features[featureName] || false;
};

// Method to check usage limits
tenantSchema.methods.canAddUser = function() {
  const maxUsers = this.hasFeature('maxUsers') || this.settings.features.maxUsers;
  return this.usage.totalUsers < maxUsers;
};

tenantSchema.methods.canAddClient = function() {
  const maxClients = this.hasFeature('maxClients') || this.settings.features.maxClients;
  return this.usage.totalClients < maxClients;
};

tenantSchema.methods.canAddDeal = function() {
  const maxDeals = this.hasFeature('maxDeals') || this.settings.features.maxDeals;
  return this.usage.totalDeals < maxDeals;
};

// Pre-save middleware to generate slug if not provided
tenantSchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .trim();
  }
  
  // Ensure slug is set
  if (!this.slug) {
    return next(new Error('Unable to generate slug from company name'));
  }
  
  next();
});

export default mongoose.model('Tenant', tenantSchema);
