import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  
  // Product Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  sku: {
    type: String,
    required: true,
    trim: true
  },
  
  description: {
    type: String,
    default: ''
  },
  
  // Category & Subcategory (multi-level)
  category: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  subcategories: [{
    type: String,
    trim: true
  }],
  
  // Pricing
  price: {
    type: Number,
    required: true,
    min: 0
  },
  
  currency: {
    type: String,
    default: 'UGX',
    enum: ['UGX', 'USD', 'KES', 'TZS']
  },
  
  // Inventory
  unit: {
    type: String,
    default: 'piece',
    enum: ['piece', 'box', 'carton', 'kg', 'litre', 'bottle', 'packet', 'dozen']
  },
  
  stockQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Images (optional)
  images: [{
    url: String,
    alt: String
  }],
  
  // Metadata
  tags: [String],
  
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

// Compound index for tenant + SKU uniqueness
productSchema.index({ tenant: 1, sku: 1 }, { unique: true });

// Index for searching
productSchema.index({ name: 'text', description: 'text' });

// Virtual for low stock alert
productSchema.virtual('isLowStock').get(function() {
  return this.stockQuantity <= this.lowStockThreshold;
});

// Method to update stock
productSchema.methods.updateStock = function(quantity, operation = 'subtract') {
  if (operation === 'subtract') {
    this.stockQuantity = Math.max(0, this.stockQuantity - quantity);
  } else {
    this.stockQuantity += quantity;
  }
  return this.save();
};

const Product = mongoose.model('Product', productSchema);

export default Product;
