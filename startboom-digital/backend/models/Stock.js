// models/Stock.js
import mongoose from 'mongoose';

const stockSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: String,
  category: {
    type: String,
    trim: true
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  currentStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  minimumStock: {
    type: Number,
    default: 10,
    min: 0
  },
  maximumStock: {
    type: Number,
    min: 0
  },
  supplier: String,
  lastRestocked: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Multi-Tenant Field
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant is required']
  }
}, {
  timestamps: true
});

// Virtual for low stock warning
stockSchema.virtual('isLowStock').get(function() {
  return this.currentStock <= this.minimumStock;
});


stockSchema.virtual('stockStatus').get(function() {
  if (this.currentStock === 0) return 'out_of_stock';
  if (this.currentStock <= this.minimumStock) return 'low_stock';
  if (this.maximumStock && this.currentStock >= this.maximumStock) return 'over_stock';
  return 'normal';
});

// Method to update stock levels
stockSchema.methods.updateStock = function(quantity, operation = 'add') {
  if (operation === 'add') {
    this.currentStock += quantity;
    this.lastRestocked = new Date();
  } else if (operation === 'subtract') {
    if (this.currentStock >= quantity) {
      this.currentStock -= quantity;
    } else {
      throw new Error('Insufficient stock');
    }
  }
  return this.save();
};

export default mongoose.model('Stock', stockSchema);










