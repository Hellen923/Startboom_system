// models/Pipeline.js
import mongoose from 'mongoose';

const pipelineStageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  color: {
    type: String,
    default: '#3B82F6' // Blue
  },
  
  order: {
    type: Number,
    required: true
  },
  
  // Is this a final/terminal stage? (won/lost)
  isFinal: {
    type: Boolean,
    default: false
  },
  
  // For won/lost distinction
  finalType: {
    type: String,
    enum: ['won', 'lost', 'none'],
    default: 'none'
  },
  
  // Probability of winning when in this stage (0-100)
  probability: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  
  // Auto-actions when deal enters this stage
  automations: {
    sendEmail: { type: Boolean, default: false },
    emailTemplate: { type: String, default: '' },
    createTask: { type: Boolean, default: false },
    taskTemplate: { type: String, default: '' },
    notifyUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  
  // SLA for this stage (days)
  slaMinDays: { type: Number, default: null },
  slaMaxDays: { type: Number, default: null },
  
  // Description for guidance
  description: {
    type: String,
    default: ''
  }
}, { _id: false });

const pipelineSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant is required'],
    index: true
  },
  
  name: {
    type: String,
    required: [true, 'Pipeline name is required'],
    trim: true
  },
  
  description: {
    type: String,
    default: '',
    trim: true
  },
  
  // Which entity type does this pipeline apply to?
  entityType: {
    type: String,
    enum: ['deal', 'client', 'sale', 'project', 'ticket', 'recruitment'],
    default: 'deal',
    required: true
  },
  
  // Pipeline stages
  stages: [pipelineStageSchema],
  
  // Is this the default pipeline for this entity type?
  isDefault: {
    type: Boolean,
    default: false
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Which departments can use this pipeline?
  departments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  }],
  
  // Pipeline settings
  settings: {
    requireNotesOnStageChange: { type: Boolean, default: false },
    requireApprovalToWin: { type: Boolean, default: false },
    approvers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    allowSkipStages: { type: Boolean, default: true },
    autoArchiveAfterDays: { type: Number, default: null }
  },
  
  // Usage statistics
  stats: {
    totalDeals: { type: Number, default: 0 },
    activeDeals: { type: Number, default: 0 },
    wonDeals: { type: Number, default: 0 },
    lostDeals: { type: Number, default: 0 },
    averageDaysToClose: { type: Number, default: 0 }
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
pipelineSchema.index({ tenant: 1, entityType: 1 });
pipelineSchema.index({ tenant: 1, isDefault: 1 });
pipelineSchema.index({ tenant: 1, name: 1 }, { unique: true });

// Ensure stages are sorted by order before saving
pipelineSchema.pre('save', function(next) {
  if (this.stages && this.stages.length > 0) {
    this.stages.sort((a, b) => a.order - b.order);
  }
  next();
});

// Method to get stage by name
pipelineSchema.methods.getStage = function(stageName) {
  return this.stages.find(s => s.name === stageName);
};

// Method to get next stage
pipelineSchema.methods.getNextStage = function(currentStageName) {
  const currentStage = this.getStage(currentStageName);
  if (!currentStage) return null;
  
  const currentIndex = this.stages.findIndex(s => s.name === currentStageName);
  if (currentIndex === -1 || currentIndex === this.stages.length - 1) return null;
  
  return this.stages[currentIndex + 1];
};

// Method to get previous stage
pipelineSchema.methods.getPreviousStage = function(currentStageName) {
  const currentIndex = this.stages.findIndex(s => s.name === currentStageName);
  if (currentIndex <= 0) return null;
  
  return this.stages[currentIndex - 1];
};

// Method to add stage
pipelineSchema.methods.addStage = function(stageData) {
  // Set order if not provided
  if (!stageData.order) {
    stageData.order = this.stages.length + 1;
  }
  
  this.stages.push(stageData);
  this.stages.sort((a, b) => a.order - b.order);
  
  return this.save();
};

// Method to remove stage
pipelineSchema.methods.removeStage = function(stageName) {
  this.stages = this.stages.filter(s => s.name !== stageName);
  
  // Reorder remaining stages
  this.stages.forEach((stage, index) => {
    stage.order = index + 1;
  });
  
  return this.save();
};

// Method to reorder stages
pipelineSchema.methods.reorderStages = function(stageOrder) {
  // stageOrder is array of stage names in desired order
  const reordered = [];
  
  stageOrder.forEach((stageName, index) => {
    const stage = this.getStage(stageName);
    if (stage) {
      stage.order = index + 1;
      reordered.push(stage);
    }
  });
  
  this.stages = reordered;
  return this.save();
};

// Static method to get default pipeline for entity type
pipelineSchema.statics.getDefault = async function(tenantId, entityType) {
  return this.findOne({
    tenant: tenantId,
    entityType: entityType,
    isDefault: true,
    isActive: true
  });
};

// Static method to create default sales pipeline
pipelineSchema.statics.createDefaultSalesPipeline = async function(tenantId, createdBy) {
  const defaultPipeline = new this({
    tenant: tenantId,
    name: 'Sales Pipeline',
    entityType: 'deal',
    isDefault: true,
    stages: [
      { name: 'Lead', color: '#6B7280', order: 1, probability: 10, description: 'New potential opportunity' },
      { name: 'Qualification', color: '#3B82F6', order: 2, probability: 25, description: 'Qualifying the opportunity' },
      { name: 'Proposal', color: '#8B5CF6', order: 3, probability: 50, description: 'Proposal sent to client' },
      { name: 'Negotiation', color: '#F59E0B', order: 4, probability: 75, description: 'Negotiating terms' },
      { name: 'Won', color: '#10B981', order: 5, probability: 100, isFinal: true, finalType: 'won', description: 'Deal closed successfully' },
      { name: 'Lost', color: '#EF4444', order: 6, probability: 0, isFinal: true, finalType: 'lost', description: 'Deal did not close' }
    ],
    createdBy: createdBy
  });
  
  return defaultPipeline.save();
};

const Pipeline = mongoose.model('Pipeline', pipelineSchema);

export default Pipeline;
