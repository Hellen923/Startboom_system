// models/Message.js
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant is required'],
    index: true
  },
  
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: [true, 'Conversation is required'],
    index: true
  },
  
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required'],
    index: true
  },
  
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: 5000
  },
  
  type: {
    type: String,
    enum: ['text', 'file', 'image', 'system'],
    default: 'text'
  },
  
  // For file/image messages
  fileUrl: {
    type: String,
    default: null
  },
  
  fileName: {
    type: String,
    default: null
  },
  
  fileSize: {
    type: Number,
    default: null
  },
  
  // Read receipts
  isRead: {
    type: Boolean,
    default: false
  },
  
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // For replies/threads
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  
  // Message status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for performance
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ tenant: 1, isDeleted: 1 });

// Virtual for formatted timestamp
messageSchema.virtual('formattedTime').get(function() {
  const now = new Date();
  const messageDate = new Date(this.createdAt);
  const diffInHours = (now - messageDate) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    // Today: show time only
    return messageDate.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else if (diffInHours < 48) {
    // Yesterday
    return 'Yesterday';
  } else if (diffInHours < 168) {
    // This week: show day
    return messageDate.toLocaleDateString('en-US', { weekday: 'short' });
  } else {
    // Older: show date
    return messageDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
});

// Method to mark as read
messageSchema.methods.markAsRead = async function(userId) {
  if (!this.readBy.some(r => r.user.toString() === userId.toString())) {
    this.readBy.push({ user: userId, readAt: new Date() });
    this.isRead = true;
    this.status = 'read';
    await this.save();
  }
};

const Message = mongoose.model('Message', messageSchema);

export default Message;
