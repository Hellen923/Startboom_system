// models/Report.js
// Custom report builder with advanced analytics
import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant is required'],
    index: true
  },
  
  name: {
    type: String,
    required: [true, 'Report name is required'],
    trim: true
  },
  
  description: {
    type: String,
    default: '',
    trim: true
  },
  
  // Report type
  type: {
    type: String,
    enum: ['summary', 'detailed', 'comparison', 'trend', 'funnel', 'cohort', 'custom'],
    default: 'summary'
  },
  
  // Data source
  dataSource: {
    entity: {
      type: String,
      required: true,
      enum: ['Deal', 'Client', 'Sale', 'Activity', 'Goal', 'User', 'Forecast', 'Product', 'Invoice']
    },
    
    // Fields to include
    fields: [{
      name: String,
      label: String,
      type: String, // 'string', 'number', 'date', 'boolean', 'reference'
      aggregate: String, // 'sum', 'avg', 'count', 'min', 'max', 'none'
      format: String // 'currency', 'percentage', 'date', 'number'
    }],
    
    // Filters
    filters: [{
      field: String,
      operator: String,
      value: mongoose.Schema.Types.Mixed,
      logicalOperator: {
        type: String,
        enum: ['AND', 'OR'],
        default: 'AND'
      }
    }],
    
    // Date range
    dateRange: {
      field: String, // Which date field to filter
      type: {
        type: String,
        enum: ['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 
               'this_quarter', 'last_quarter', 'this_year', 'last_year', 'custom', 'all_time']
      },
      startDate: Date,
      endDate: Date
    },
    
    // Sorting
    sortBy: [{
      field: String,
      order: {
        type: String,
        enum: ['asc', 'desc'],
        default: 'desc'
      }
    }],
    
    // Limit
    limit: {
      type: Number,
      default: 1000
    }
  },
  
  // Grouping/breakdown
  groupBy: [{
    field: String,
    label: String,
    interval: String // For date fields: 'day', 'week', 'month', 'quarter', 'year'
  }],
  
  // Visualization
  visualization: {
    type: {
      type: String,
      enum: ['table', 'bar', 'line', 'pie', 'donut', 'area', 'scatter', 'funnel', 'gauge', 'metric'],
      default: 'table'
    },
    
    config: {
      xAxis: String,
      yAxis: [String],
      legend: Boolean,
      stacked: Boolean,
      colors: [String],
      showValues: Boolean,
      showTotals: Boolean
    }
  },
  
  // Calculated fields/metrics
  calculatedFields: [{
    name: String,
    label: String,
    formula: String, // JavaScript expression
    format: String
  }],
  
  // Scheduling
  schedule: {
    enabled: {
      type: Boolean,
      default: false
    },
    
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly'],
      default: 'weekly'
    },
    
    time: String, // HH:MM format
    dayOfWeek: Number, // 0-6 for weekly
    dayOfMonth: Number, // 1-31 for monthly
    
    recipients: [{
      type: String // Email addresses
    }],
    
    format: {
      type: String,
      enum: ['pdf', 'excel', 'csv', 'html'],
      default: 'pdf'
    },
    
    lastRun: Date,
    nextRun: Date
  },
  
  // Access control
  visibility: {
    type: String,
    enum: ['private', 'team', 'department', 'branch', 'company'],
    default: 'private'
  },
  
  sharedWith: [{
    type: {
      type: String,
      enum: ['user', 'team', 'department', 'branch', 'role']
    },
    id: mongoose.Schema.Types.ObjectId,
    permission: {
      type: String,
      enum: ['view', 'edit'],
      default: 'view'
    }
  }],
  
  // Template
  isTemplate: {
    type: Boolean,
    default: false
  },
  
  templateCategory: String,
  
  // Stats
  stats: {
    runs: {
      type: Number,
      default: 0
    },
    lastRun: Date,
    averageExecutionTime: Number,
    favorites: {
      type: Number,
      default: 0
    }
  },
  
  // Owner
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
reportSchema.index({ tenant: 1, owner: 1, isActive: 1 });
reportSchema.index({ tenant: 1, type: 1 });
reportSchema.index({ tenant: 1, 'dataSource.entity': 1 });
reportSchema.index({ tenant: 1, isTemplate: 1 });
reportSchema.index({ tenant: 1, 'schedule.enabled': 1, 'schedule.nextRun': 1 });

// Method to calculate next run time
reportSchema.methods.calculateNextRun = function() {
  if (!this.schedule.enabled) return null;
  
  const now = new Date();
  const nextRun = new Date();
  
  // Parse time (HH:MM)
  if (this.schedule.time) {
    const [hours, minutes] = this.schedule.time.split(':').map(Number);
    nextRun.setHours(hours, minutes, 0, 0);
  }
  
  switch (this.schedule.frequency) {
    case 'daily':
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;
      
    case 'weekly':
      nextRun.setDate(nextRun.getDate() + ((7 + this.schedule.dayOfWeek - nextRun.getDay()) % 7));
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 7);
      }
      break;
      
    case 'monthly':
      nextRun.setDate(this.schedule.dayOfMonth);
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1);
      }
      break;
      
    case 'quarterly':
      // Set to first day of next quarter
      const currentQuarter = Math.floor(now.getMonth() / 3);
      nextRun.setMonth((currentQuarter + 1) * 3, 1);
      break;
  }
  
  return nextRun;
};

// Method to record run
reportSchema.methods.recordRun = async function(executionTime) {
  this.stats.runs += 1;
  this.stats.lastRun = new Date();
  
  if (executionTime) {
    const totalTime = (this.stats.averageExecutionTime || 0) * (this.stats.runs - 1);
    this.stats.averageExecutionTime = Math.round((totalTime + executionTime) / this.stats.runs);
  }
  
  if (this.schedule.enabled) {
    this.schedule.lastRun = new Date();
    this.schedule.nextRun = this.calculateNextRun();
  }
  
  await this.save();
};

// Static method to get due reports
reportSchema.statics.getDueReports = async function() {
  return this.find({
    'schedule.enabled': true,
    'schedule.nextRun': { $lte: new Date() },
    isActive: true
  });
};

// Static method to get report templates
reportSchema.statics.getTemplates = async function(category = null) {
  const query = { isTemplate: true, isActive: true };
  if (category) query.templateCategory = category;
  
  return this.find(query).sort({ name: 1 });
};

const Report = mongoose.model('Report', reportSchema);

export default Report;
