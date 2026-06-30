// models/Sale.js
import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100 // Percentage discount
  },
  totalPrice: {
    type: Number,
    min: 0
  }
}, { _id: false });

const saleSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  customerPhone: {
    type: String,
    trim: true
  },
  items: [saleItemSchema],
  totalAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  finalAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  exchangeRate: {
    type: Number,
    default: 1
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit'],
    default: 'cash'
  },
  status: {
    type: String,
    enum: ['completed', 'pending', 'cancelled'],
    default: 'completed'
  },
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
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  notes: String,
  saleDate: {
    type: Date,
    default: Date.now
  },
  // For credit sales
  dueDate: Date,
  creditStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid'
  },
  payments: [{
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'online'],
      default: 'cash'
    },
    // Bank transfer specific fields
    cardNumber: String,
    bankName: String,
    accountName: String,
    notes: String
  }],
  // Tasks for this sale
  tasks: [{
    title: {
      type: String,
      required: true
    },
    subject: {
      type: String,
      enum: ['Call', 'Email', 'Meeting', 'Follow-up', 'Support', 'Other'],
      default: 'Follow-up'
    },
    description: String,
    dueDate: Date,
    dueTime: String,
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['In progress', 'Completed', 'Waiting on someone else', 'Deferred'],
      default: 'In progress'
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'Critical'],
      default: 'Medium'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Calculate totals before saving
saleSchema.pre('save', function(next) {
  try {
    let totalAmount = 0;
    let discountAmount = 0;

    if (!this.items || !Array.isArray(this.items) || this.items.length === 0) {
      const amount = Number(this.finalAmount || this.totalAmount || 0);
      if (amount <= 0) {
        return next(new Error('Sale amount must be greater than 0'));
      }
      this.totalAmount = amount;
      this.discountAmount = 0;
      this.finalAmount = amount;
      return next();
    }

    let hasInvalidItem = false;
    this.items.forEach(item => {
      // Ensure all required fields are present and valid
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const discount = Number(item.discount) || 0;

      if (quantity <= 0) {
        hasInvalidItem = true;
        console.error('Invalid quantity for item:', item);
        return;
      }
      
      if (unitPrice < 0) {
        hasInvalidItem = true;
        console.error('Invalid unit price for item:', item);
        return;
      }

      const itemTotal = quantity * unitPrice;
      const itemDiscount = itemTotal * (discount / 100);

      // Store calculated total price on the item
      item.totalPrice = itemTotal - itemDiscount;

      totalAmount += itemTotal;
      discountAmount += itemDiscount;
    });

    if (hasInvalidItem) {
      return next(new Error('Invalid item data: quantity must be greater than 0 and unit price must be non-negative'));
    }

    // Set the calculated totals
    this.totalAmount = totalAmount;
    this.discountAmount = discountAmount;
    this.finalAmount = totalAmount - discountAmount;

    next();
  } catch (error) {
    console.error('Error in sale pre-save hook:', error);
    next(error);
  }
});

// Update credit status based on payments
saleSchema.methods.updateCreditStatus = function() {
  if (this.paymentMethod !== 'credit') return;

  const totalPaid = this.payments.reduce((sum, payment) => sum + payment.amount, 0);

  if (totalPaid === 0) {
    this.creditStatus = 'unpaid';
  } else if (totalPaid >= this.finalAmount) {
    this.creditStatus = 'paid';
  } else {
    this.creditStatus = 'partial';
  }
};

export default mongoose.model('Sale', saleSchema);
