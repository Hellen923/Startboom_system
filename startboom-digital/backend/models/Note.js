// models/Note.js
// Shared notes and documents for team collaboration
import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant is required'],
    index: true
  },
  
  title: {
    type: String,
    required: [true, 'Note title is required'],
    trim: true
  },
  
  content: {
    type: String,
    default: '',
    trim: true
  },
  
  // Note type
  type: {
    type: String,
    enum: ['note', 'document', 'guide', 'template', 'meeting_notes', 'call_script', 'playbook'],
    default: 'note'
  },
  
  // Rich text format
  format: {
    type: String,
    enum: ['plain', 'markdown', 'html'],
    default: 'markdown'
  },
  
  // Category/folder
  category: {
    type: String,
    trim: true
  },
  
  // Tags
  tags: [String],
  
  // Linked entities
  linkedEntities: [{
    entityType: String,
    entityId: mongoose.Schema.Types.ObjectId,
    entityName: String
  }],
  
  // Sharing and permissions
  visibility: {
    type: String,
    enum: ['private', 'team', 'department', 'branch', 'company'],
    default: 'team'
  },
  
  sharedWith: [{
    type: {
      type: String,
      enum: ['user', 'team', 'department', 'branch']
    },
    id: mongoose.Schema.Types.ObjectId,
    permission: {
      type: String,
      enum: ['view', 'edit', 'admin'],
      default: 'view'
    }
  }],
  
  // Collaboration features
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['owner', 'editor', 'viewer'],
      default: 'viewer'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Version control
  version: {
    type: Number,
    default: 1
  },
  
  versionHistory: [{
    version: Number,
    content: String,
    title: String,
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    editedAt: Date,
    changeDescription: String
  }],
  
  // Attachments
  attachments: [{
    filename: String,
    url: String,
    fileType: String,
    size: Number,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: Date
  }],
  
  // Pinned/favorited
  isPinned: {
    type: Boolean,
    default: false
  },
  
  favoritedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Template
  isTemplate: {
    type: Boolean,
    default: false
  },
  
  templateCategory: String,
  
  // Stats
  stats: {
    views: {
      type: Number,
      default: 0
    },
    lastViewedAt: Date,
    edits: {
      type: Number,
      default: 0
    }
  },
  
  // Owner
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  
  deletedAt: Date,
  
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
noteSchema.index({ tenant: 1, owner: 1, isDeleted: false });
noteSchema.index({ tenant: 1, type: 1, category: 1 });
noteSchema.index({ tenant: 1, visibility: 1 });
noteSchema.index({ tenant: 1, tags: 1 });
noteSchema.index({ tenant: 1, isTemplate: 1 });
noteSchema.index({ tenant: 1, 'linkedEntities.entityType': 1, 'linkedEntities.entityId': 1 });

// Text search
noteSchema.index({ title: 'text', content: 'text', tags: 'text' });

// Method to save version
noteSchema.methods.saveVersion = async function(userId, changeDescription = '') {
  this.versionHistory.push({
    version: this.version,
    content: this.content,
    title: this.title,
    editedBy: userId,
    editedAt: new Date(),
    changeDescription
  });
  
  this.version += 1;
  this.stats.edits += 1;
  
  await this.save();
  return this;
};

// Method to add collaborator
noteSchema.methods.addCollaborator = async function(userId, role = 'viewer') {
  // Check if already a collaborator
  const existing = this.collaborators.find(c => 
    c.user.toString() === userId.toString()
  );
  
  if (!existing) {
    this.collaborators.push({
      user: userId,
      role
    });
    await this.save();
  }
  
  return this;
};

// Method to increment view count
noteSchema.methods.recordView = async function() {
  this.stats.views += 1;
  this.stats.lastViewedAt = new Date();
  await this.save();
};

// Static method to search notes
noteSchema.statics.searchNotes = async function(tenantId, searchQuery, filters = {}) {
  const query = {
    tenant: tenantId,
    isDeleted: false,
    $text: { $search: searchQuery }
  };
  
  if (filters.type) query.type = filters.type;
  if (filters.category) query.category = filters.category;
  if (filters.owner) query.owner = filters.owner;
  if (filters.visibility) query.visibility = filters.visibility;
  if (filters.tags && filters.tags.length > 0) {
    query.tags = { $in: filters.tags };
  }
  
  return this.find(query)
    .populate('owner', 'name email avatar')
    .populate('collaborators.user', 'name email')
    .sort({ score: { $meta: 'textScore' } })
    .limit(50);
};

const Note = mongoose.model('Note', noteSchema);

export default Note;
