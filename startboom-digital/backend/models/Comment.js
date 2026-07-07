// models/Comment.js
// Comments system for collaborative discussions on entities
import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant is required'],
    index: true
  },
  
  // What entity is this comment on?
  entityType: {
    type: String,
    required: true,
    enum: ['Client', 'Deal', 'Sale', 'Activity', 'Goal', 'Task', 'Meeting', 'Forecast'],
    index: true
  },
  
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'entityType',
    index: true
  },
  
  // Comment author
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Comment content
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true
  },
  
  // Mentions (@username)
  mentions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notified: {
      type: Boolean,
      default: false
    }
  }],
  
  // Parent comment (for replies/threads)
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  
  // Thread depth (0 = top-level)
  threadDepth: {
    type: Number,
    default: 0
  },
  
  // Attachments
  attachments: [{
    filename: String,
    url: String,
    fileType: String,
    size: Number
  }],
  
  // Rich text/formatting
  format: {
    type: String,
    enum: ['plain', 'markdown', 'html'],
    default: 'plain'
  },
  
  // Reactions (emoji reactions)
  reactions: [{
    emoji: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Edit history
  isEdited: {
    type: Boolean,
    default: false
  },
  
  editHistory: [{
    content: String,
    editedAt: Date,
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  
  deletedAt: Date,
  
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Pinned comment
  isPinned: {
    type: Boolean,
    default: false
  },
  
  pinnedAt: Date,
  
  // Internal vs external comment
  isInternal: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
commentSchema.index({ tenant: 1, entityType: 1, entityId: 1, createdAt: -1 });
commentSchema.index({ tenant: 1, author: 1, createdAt: -1 });
commentSchema.index({ 'mentions.user': 1, 'mentions.notified': 1 });
commentSchema.index({ parentComment: 1 });

// Virtual for reply count
commentSchema.virtual('replyCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment',
  count: true
});

// Method to add reaction
commentSchema.methods.addReaction = async function(emoji, userId) {
  // Check if user already reacted with this emoji
  const existing = this.reactions.find(r => 
    r.emoji === emoji && r.user.toString() === userId.toString()
  );
  
  if (!existing) {
    this.reactions.push({ emoji, user: userId });
    await this.save();
  }
  
  return this;
};

// Method to remove reaction
commentSchema.methods.removeReaction = async function(emoji, userId) {
  this.reactions = this.reactions.filter(r => 
    !(r.emoji === emoji && r.user.toString() === userId.toString())
  );
  
  await this.save();
  return this;
};

// Method to edit comment
commentSchema.methods.edit = async function(newContent, userId) {
  // Save to edit history
  this.editHistory.push({
    content: this.content,
    editedAt: new Date(),
    editedBy: userId
  });
  
  this.content = newContent;
  this.isEdited = true;
  
  await this.save();
  return this;
};

// Static method to get comment thread
commentSchema.statics.getThread = async function(commentId) {
  const comment = await this.findById(commentId)
    .populate('author', 'name email avatar')
    .populate('mentions.user', 'name email');
  
  if (!comment) return null;
  
  // Get all replies
  const replies = await this.find({ parentComment: commentId, isDeleted: false })
    .populate('author', 'name email avatar')
    .populate('mentions.user', 'name email')
    .sort({ createdAt: 1 });
  
  return {
    comment,
    replies
  };
};

// Static method to get entity comments
commentSchema.statics.getEntityComments = async function(entityType, entityId, options = {}) {
  const {
    includeReplies = true,
    includeDeleted = false,
    limit = 50,
    skip = 0
  } = options;
  
  const query = {
    entityType,
    entityId,
    parentComment: null // Only top-level comments
  };
  
  if (!includeDeleted) {
    query.isDeleted = false;
  }
  
  let comments = await this.find(query)
    .populate('author', 'name email avatar')
    .populate('mentions.user', 'name email')
    .sort({ isPinned: -1, createdAt: -1 })
    .limit(limit)
    .skip(skip);
  
  // Get replies if requested
  if (includeReplies) {
    for (let comment of comments) {
      comment._doc.replies = await this.find({ 
        parentComment: comment._id, 
        isDeleted: false 
      })
        .populate('author', 'name email avatar')
        .sort({ createdAt: 1 });
    }
  }
  
  return comments;
};

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
