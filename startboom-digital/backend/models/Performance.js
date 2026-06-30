import mongoose from 'mongoose';

const performanceSchema = new mongoose.Schema({
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Multi-Tenant Field
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant is required']
  },
  period: {
    month: Number,
    year: Number
  },
  metrics: {
    dealsWon: Number,
    dealsLost: Number,
    totalValue: Number,
    clientsAcquired: Number,
    meetings: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Performance', performanceSchema);