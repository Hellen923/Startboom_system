// models/WorkflowExecution.js
// Log of workflow executions for audit and debugging
import mongoose from 'mongoose';

const workflowExecutionSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  
  workflow: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
    required: true,
    index: true
  },
  
  workflowName: String,
  
  // What triggered this execution?
  triggerType: String,
  
  // Entity that triggered the workflow
  triggerEntity: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'triggerEntityType'
  },
  
  triggerEntityType: {
    type: String,
    enum: ['Client', 'Deal', 'Sale', 'Activity', 'Goal', 'User', 'Task']
  },
  
  // Execution details
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  startedAt: {
    type: Date,
    default: Date.now
  },
  
  completedAt: Date,
  
  executionTime: Number, // milliseconds
  
  // Actions executed
  actionsExecuted: [{
    actionType: String,
    status: String,
    startedAt: Date,
    completedAt: Date,
    result: mongoose.Schema.Types.Mixed,
    error: String
  }],
  
  // Overall result
  result: {
    success: Boolean,
    message: String,
    data: mongoose.Schema.Types.Mixed
  },
  
  // Error details
  error: {
    message: String,
    stack: String,
    actionIndex: Number
  },
  
  // Context data available during execution
  context: mongoose.Schema.Types.Mixed,
  
  // Retry information
  retryCount: {
    type: Number,
    default: 0
  },
  
  retryOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkflowExecution'
  }
}, {
  timestamps: true
});

// Indexes
workflowExecutionSchema.index({ tenant: 1, workflow: 1, createdAt: -1 });
workflowExecutionSchema.index({ tenant: 1, status: 1, createdAt: -1 });
workflowExecutionSchema.index({ tenant: 1, triggerType: 1 });
workflowExecutionSchema.index({ startedAt: -1 });

// Method to mark as completed
workflowExecutionSchema.methods.complete = function(success, result = {}, error = null) {
  this.status = success ? 'completed' : 'failed';
  this.completedAt = new Date();
  this.executionTime = this.completedAt - this.startedAt;
  this.result = {
    success,
    message: result.message || (success ? 'Workflow completed successfully' : 'Workflow execution failed'),
    data: result.data
  };
  
  if (error) {
    this.error = {
      message: error.message || error,
      stack: error.stack,
      actionIndex: result.actionIndex
    };
  }
  
  return this.save();
};

// Static method to get execution stats
workflowExecutionSchema.statics.getStats = async function(tenantId, workflowId, startDate, endDate) {
  const match = {
    tenant: tenantId
  };
  
  if (workflowId) match.workflow = workflowId;
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = startDate;
    if (endDate) match.createdAt.$lte = endDate;
  }
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgExecutionTime: { $avg: '$executionTime' }
      }
    }
  ]);
  
  return stats;
};

const WorkflowExecution = mongoose.model('WorkflowExecution', workflowExecutionSchema);

export default WorkflowExecution;
