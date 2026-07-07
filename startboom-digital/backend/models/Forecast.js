// models/Forecast.js
import mongoose from 'mongoose';

const forecastSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant is required'],
    index: true
  },
  
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  // Forecast period
  period: {
    type: String,
    enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
    required: true,
    default: 'monthly'
  },
  
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  
  endDate: {
    type: Date,
    required: true,
    index: true
  },
  
  // What are we forecasting?
  metric: {
    type: String,
    enum: ['revenue', 'deals', 'sales_volume', 'custom'],
    required: true,
    default: 'revenue'
  },
  
  customMetricName: {
    type: String,
    trim: true
  },
  
  // Forecast values (weighted pipeline)
  commit: {
    type: Number,
    default: 0,
    min: 0
    // Sum of deals with ≥90% probability
  },
  
  bestCase: {
    type: Number,
    default: 0,
    min: 0
    // Sum of deals with ≥50% probability
  },
  
  worstCase: {
    type: Number,
    default: 0,
    min: 0
    // Sum of deals with ≥25% probability
  },
  
  pipeline: {
    type: Number,
    default: 0,
    min: 0
    // Total weighted pipeline value
  },
  
  // Actual results (filled in as deals close)
  actual: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Accuracy tracking
  accuracy: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
    // How accurate was the forecast vs actual
  },
  
  variance: {
    type: Number,
    default: 0
    // Difference between forecast and actual
  },
  
  variancePercentage: {
    type: Number,
    default: 0
    // % difference
  },
  
  // Pipeline coverage (pipeline / target)
  coverage: {
    type: Number,
    default: 0
    // Should be ≥3.0x for healthy pipeline
  },
  
  target: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Breakdown by stage
  stageBreakdown: [{
    stageName: String,
    dealCount: Number,
    totalValue: Number,
    weightedValue: Number,
    averageProbability: Number
  }],
  
  // Top deals contributing to forecast
  topDeals: [{
    dealId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },
    dealName: String,
    value: Number,
    weightedValue: Number,
    probability: Number,
    stage: String
  }],
  
  // Historical comparison
  previousPeriod: {
    commit: Number,
    actual: Number,
    variance: Number
  },
  
  // Who is this forecast for?
  assignmentType: {
    type: String,
    enum: ['company', 'branch', 'department', 'team', 'individual'],
    required: true
  },
  
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    index: true
  },
  
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    index: true
  },
  
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    index: true
  },
  
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  status: {
    type: String,
    enum: ['draft', 'active', 'closed', 'archived'],
    default: 'active',
    index: true
  },
  
  // Auto-update settings
  autoUpdate: {
    enabled: { type: Boolean, default: true },
    lastUpdated: Date
  },
  
  // Notes and insights
  notes: {
    type: String,
    default: ''
  },
  
  insights: [{
    type: String,
    generatedAt: { type: Date, default: Date.now }
  }],
  
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
forecastSchema.index({ tenant: 1, period: 1, startDate: -1 });
forecastSchema.index({ tenant: 1, assignmentType: 1, status: 1 });
forecastSchema.index({ tenant: 1, user: 1, startDate: 1 });

// Calculate accuracy before saving
forecastSchema.pre('save', function(next) {
  if (this.actual > 0 && this.commit > 0) {
    // Calculate variance
    this.variance = this.actual - this.commit;
    this.variancePercentage = ((this.variance / this.commit) * 100).toFixed(2);
    
    // Calculate accuracy (how close to commit)
    const difference = Math.abs(this.actual - this.commit);
    const maxValue = Math.max(this.actual, this.commit);
    
    if (maxValue > 0) {
      this.accuracy = Math.max(0, 100 - ((difference / maxValue) * 100));
    }
  }
  
  // Calculate coverage
  if (this.target > 0 && this.pipeline > 0) {
    this.coverage = (this.pipeline / this.target).toFixed(2);
  }
  
  next();
});

// Method to generate insights
forecastSchema.methods.generateInsights = function() {
  const insights = [];
  
  // Pipeline coverage insight
  if (this.coverage < 2.0) {
    insights.push(`⚠️ Pipeline coverage is ${this.coverage}x. Need at least 2.0x (ideally 3.0x) for healthy pipeline.`);
  } else if (this.coverage >= 3.0) {
    insights.push(`✅ Excellent pipeline coverage at ${this.coverage}x target.`);
  }
  
  // Commit vs target
  const commitVsTarget = (this.commit / this.target) * 100;
  if (commitVsTarget < 70) {
    insights.push(`⚠️ Commit forecast (${commitVsTarget.toFixed(0)}% of target) is below 70%. Risk of missing target.`);
  } else if (commitVsTarget >= 100) {
    insights.push(`✅ Commit forecast exceeds target by ${(commitVsTarget - 100).toFixed(0)}%.`);
  }
  
  // Accuracy tracking (if closed)
  if (this.status === 'closed' && this.accuracy > 0) {
    if (this.accuracy >= 95) {
      insights.push(`🎯 Excellent forecast accuracy: ${this.accuracy.toFixed(1)}%`);
    } else if (this.accuracy < 80) {
      insights.push(`📉 Forecast accuracy was ${this.accuracy.toFixed(1)}%. Review forecasting methodology.`);
    }
  }
  
  this.insights = insights.map(text => ({ 
    type: String, 
    generatedAt: new Date() 
  }));
  
  return insights;
};

// Static method to calculate forecast from pipeline
forecastSchema.statics.calculateFromPipeline = async function(deals, target = 0) {
  let commit = 0;
  let bestCase = 0;
  let worstCase = 0;
  let pipeline = 0;
  
  const stageBreakdown = {};
  const topDeals = [];
  
  deals.forEach(deal => {
    const probability = deal.probability || deal.currentStage?.probability || 0;
    const value = deal.value || 0;
    const weightedValue = (value * probability) / 100;
    
    // Add to pipeline
    pipeline += weightedValue;
    
    // Commit (≥90% probability)
    if (probability >= 90) {
      commit += weightedValue;
    }
    
    // Best case (≥50% probability)
    if (probability >= 50) {
      bestCase += weightedValue;
    }
    
    // Worst case (≥25% probability)
    if (probability >= 25) {
      worstCase += weightedValue;
    }
    
    // Stage breakdown
    const stageName = deal.currentStage?.name || deal.stage || 'Unknown';
    if (!stageBreakdown[stageName]) {
      stageBreakdown[stageName] = {
        stageName,
        dealCount: 0,
        totalValue: 0,
        weightedValue: 0,
        totalProbability: 0
      };
    }
    
    stageBreakdown[stageName].dealCount += 1;
    stageBreakdown[stageName].totalValue += value;
    stageBreakdown[stageName].weightedValue += weightedValue;
    stageBreakdown[stageName].totalProbability += probability;
    
    // Top deals (for visibility)
    topDeals.push({
      dealId: deal._id,
      dealName: deal.title || deal.name,
      value,
      weightedValue,
      probability,
      stage: stageName
    });
  });
  
  // Calculate average probability per stage
  Object.values(stageBreakdown).forEach(stage => {
    stage.averageProbability = stage.dealCount > 0 
      ? Math.round(stage.totalProbability / stage.dealCount)
      : 0;
  });
  
  // Sort top deals by weighted value
  topDeals.sort((a, b) => b.weightedValue - a.weightedValue);
  
  return {
    commit: Math.round(commit),
    bestCase: Math.round(bestCase),
    worstCase: Math.round(worstCase),
    pipeline: Math.round(pipeline),
    target,
    coverage: target > 0 ? (pipeline / target).toFixed(2) : 0,
    stageBreakdown: Object.values(stageBreakdown),
    topDeals: topDeals.slice(0, 10) // Top 10 deals
  };
};

const Forecast = mongoose.model('Forecast', forecastSchema);

export default Forecast;
