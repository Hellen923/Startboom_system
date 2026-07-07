// models/Workflow.js
// Automation workflow model with triggers and actions
import mongoose from 'mongoose';

const workflowSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant is required'],
    index: true
  },
  
  name: {
    type: String,
    required: [true, 'Workflow name is required'],
    trim: true
  },
  
  description: {
    type: String,
    default: '',
    trim: true
  },
  
  // Trigger configuration
  trigger: {
    // What event triggers this workflow?
    type: {
      type: String,
      required: true,
      enum: [
        'deal_created', 'deal_moved', 'deal_won', 'deal_lost', 'deal_stale',
        'client_created', 'client_updated', 'client_stale',
        'activity_logged', 'activity_overdue',
        'goal_achieved', 'goal_missed', 'goal_at_risk',
        'sale_completed', 'sale_cancelled',
        'task_created', 'task_completed', 'task_overdue',
        'user_assigned', 'user_inactive',
        'forecast_below_target', 'pipeline_low_coverage',
        'time_based', 'manual'
      ]
    },
    
    // Conditions that must be met
    conditions: [{
      field: String,        // e.g., 'deal.value', 'client.status'
      operator: {           // 'equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'in', 'not_in'
        type: String,
        enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_or_equal', 'less_or_equal', 'contains', 'not_contains', 'in', 'not_in', 'is_empty', 'is_not_empty']
      },
      value: mongoose.Schema.Types.Mixed
    }],
    
    // For time-based triggers
    schedule: {
      frequency: {
        type: String,
        enum: ['once', 'daily', 'weekly', 'monthly', 'custom']
      },
      time: String,          // HH:MM format
      dayOfWeek: Number,     // 0-6 (Sunday-Saturday)
      dayOfMonth: Number,    // 1-31
      cronExpression: String // For custom schedules
    },
    
    // Entity filters
    entityType: {
      type: String,
      enum: ['deal', 'client', 'sale', 'activity', 'goal', 'task', 'user', 'any']
    }
  },
  
  // Actions to perform when triggered
  actions: [{
    order: Number,           // Execution order
    
    type: {
      type: String,
      required: true,
      enum: [
        'send_email', 'send_notification', 'send_sms', 'send_whatsapp',
        'create_task', 'create_activity', 'create_deal',
        'update_field', 'update_stage', 'update_owner',
        'assign_to_user', 'assign_to_team',
        'add_tag', 'remove_tag',
        'change_status', 'set_priority',
        'calculate_score', 'update_forecast',
        'trigger_webhook', 'call_api',
        'wait', 'conditional_branch'
      ]
    },
    
    // Action configuration
    config: {
      // For email/notification actions
      template: String,
      subject: String,
      body: String,
      recipients: [String],
      
      // For field update actions
      field: String,
      value: mongoose.Schema.Types.Mixed,
      
      // For assignment actions
      userId: mongoose.Schema.Types.ObjectId,
      teamId: mongoose.Schema.Types.ObjectId,
      
      // For task/activity creation
      title: String,
      description: String,
      dueDate: String,
      priority: String,
      
      // For webhook/API actions
      url: String,
      method: String,
      headers: mongoose.Schema.Types.Mixed,
      payload: mongoose.Schema.Types.Mixed,
      
      // For wait actions
      delay: Number,         // Delay in minutes
      
      // For conditional branch
      conditions: [{
        field: String,
        operator: String,
        value: mongoose.Schema.Types.Mixed,
        thenAction: mongoose.Schema.Types.Mixed,
        elseAction: mongoose.Schema.Types.Mixed
      }]
    },
    
    // Error handling
    onError: {
      type: String,
      enum: ['continue', 'stop', 'retry'],
      default: 'continue'
    },
    
    retryConfig: {
      maxRetries: { type: Number, default: 3 },
      retryDelay: { type: Number, default: 5 } // minutes
    }
  }],
  
  // Workflow settings
  settings: {
    // Should this workflow run automatically?
    isActive: {
      type: Boolean,
      default: true
    },
    
    // Limit executions
    maxExecutionsPerDay: Number,
    maxExecutionsPerEntity: Number,
    
    // Cooldown period (minutes) before re-triggering on same entity
    cooldownPeriod: {
      type: Number,
      default: 60
    },
    
    // Priority (higher number = higher priority)
    priority: {
      type: Number,
      default: 5,
      min: 1,
      max: 10
    },
    
    // Stop on error
    stopOnError: {
      type: Boolean,
      default: false
    },
    
    // Send notifications on execution
    notifyOnExecution: {
      type: Boolean,
      default: false
    },
    
    // Send notifications on error
    notifyOnError: {
      type: Boolean,
      default: true
    },
    
    notificationRecipients: [String]
  },
  
  // Execution stats
  stats: {
    totalExecutions: {
      type: Number,
      default: 0
    },
    successfulExecutions: {
      type: Number,
      default: 0
    },
    failedExecutions: {
      type: Number,
      default: 0
    },
    lastExecutedAt: Date,
    lastError: String,
    averageExecutionTime: Number // milliseconds
  },
  
  // Access control
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
  },
  
  // Template workflow (can be cloned)
  isTemplate: {
    type: Boolean,
    default: false
  },
  
  templateCategory: String
}, {
  timestamps: true
});

// Indexes
workflowSchema.index({ tenant: 1, 'trigger.type': 1, isActive: 1 });
workflowSchema.index({ tenant: 1, isTemplate: 1 });
workflowSchema.index({ tenant: 1, 'settings.isActive': 1 });

// Method to clone workflow
workflowSchema.methods.clone = async function(newName) {
  const cloned = new this.constructor({
    tenant: this.tenant,
    name: newName || `${this.name} (Copy)`,
    description: this.description,
    trigger: this.trigger,
    actions: this.actions,
    settings: this.settings,
    isTemplate: false
  });
  
  return cloned.save();
};

// Method to record execution
workflowSchema.methods.recordExecution = async function(success, executionTime, error = null) {
  this.stats.totalExecutions += 1;
  
  if (success) {
    this.stats.successfulExecutions += 1;
  } else {
    this.stats.failedExecutions += 1;
    this.stats.lastError = error;
  }
  
  this.stats.lastExecutedAt = new Date();
  
  // Update average execution time
  if (executionTime) {
    const totalTime = (this.stats.averageExecutionTime || 0) * (this.stats.totalExecutions - 1);
    this.stats.averageExecutionTime = Math.round((totalTime + executionTime) / this.stats.totalExecutions);
  }
  
  await this.save();
};

// Static method to find active workflows by trigger type
workflowSchema.statics.findActiveByTrigger = async function(tenantId, triggerType) {
  return this.find({
    tenant: tenantId,
    'trigger.type': triggerType,
    'settings.isActive': true,
    isActive: true
  }).sort({ 'settings.priority': -1 });
};

// Static method to get workflow templates
workflowSchema.statics.getTemplates = async function(category = null) {
  const query = { isTemplate: true, isActive: true };
  if (category) query.templateCategory = category;
  
  return this.find(query).sort({ name: 1 });
};

const Workflow = mongoose.model('Workflow', workflowSchema);

export default Workflow;
