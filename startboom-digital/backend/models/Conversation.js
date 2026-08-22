// models/Conversation.js
import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant is required'],
    index: true
  },
  
  type: {
    type: String,
    enum: ['direct', 'team', 'department', 'group'],
    default: 'direct',
    index: true
  },
  
  // For direct messages (1-on-1)
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // For team conversations
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null,
    index: true
  },
  
  // For department conversations
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null,
    index: true
  },
  
  // Conversation name (for groups)
  name: {
    type: String,
    trim: true,
    default: null
  },
  
  // Conversation description
  description: {
    type: String,
    trim: true,
    default: null
  },
  
  // Last message for preview
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  
  lastMessageAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Creator
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Conversation settings
  settings: {
    allowFiles: {
      type: Boolean,
      default: true
    },
    allowImages: {
      type: Boolean,
      default: true
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    isMuted: {
      type: Boolean,
      default: false
    }
  },
  
  // Unread count per user
  unreadCounts: {
    type: Map,
    of: Number,
    default: {}
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
conversationSchema.index({ tenant: 1, type: 1 });
conversationSchema.index({ tenant: 1, team: 1 });
conversationSchema.index({ tenant: 1, department: 1 });
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

// Virtual for unread count for specific user
conversationSchema.methods.getUnreadCount = function(userId) {
  return this.unreadCounts.get(userId.toString()) || 0;
};

// Method to increment unread count
conversationSchema.methods.incrementUnread = async function(userId) {
  const userIdStr = userId.toString();
  const current = this.unreadCounts.get(userIdStr) || 0;
  this.unreadCounts.set(userIdStr, current + 1);
  await this.save();
};

// Method to reset unread count
conversationSchema.methods.resetUnread = async function(userId) {
  this.unreadCounts.set(userId.toString(), 0);
  await this.save();
};

// Method to update last message
conversationSchema.methods.updateLastMessage = async function(messageId) {
  this.lastMessage = messageId;
  this.lastMessageAt = new Date();
  await this.save();
};

// Static method to find or create direct conversation
conversationSchema.statics.findOrCreateDirect = async function(tenantId, user1Id, user2Id) {
  // Find existing conversation between these two users
  let conversation = await this.findOne({
    tenant: tenantId,
    type: 'direct',
    participants: { $all: [user1Id, user2Id], $size: 2 }
  });
  
  // Create if doesn't exist
  if (!conversation) {
    conversation = await this.create({
      tenant: tenantId,
      type: 'direct',
      participants: [user1Id, user2Id],
      createdBy: user1Id
    });
  }
  
  return conversation;
};

// Static method to find team conversation
conversationSchema.statics.findOrCreateTeam = async function(tenantId, teamId, createdBy) {
  let conversation = await this.findOne({
    tenant: tenantId,
    type: 'team',
    team: teamId
  });
  
  if (!conversation) {
    conversation = await this.create({
      tenant: tenantId,
      type: 'team',
      team: teamId,
      createdBy: createdBy,
      name: `Team Chat` // Will be populated from team name in routes
    });
  }
  
  return conversation;
};

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
