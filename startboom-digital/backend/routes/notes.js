// routes/notes.js
import express from 'express';
import Note from '../models/Note.js';
import { tenantAuth, requireTenantModule } from '../middleware/tenantAuth.js';

const router = express.Router();

// Apply tenant authentication
router.use(tenantAuth);


// Get all notes (with filters)
router.get('/', async (req, res) => {
  try {
    const { type, category, visibility, isTemplate, tags, search } = req.query;
    
    // Use text search if search query provided
    if (search) {
      const notes = await Note.searchNotes(req.user.tenantId, search, {
        type, category, visibility, tags: tags ? tags.split(',') : []
      });
      
      return res.json({
        success: true,
        count: notes.length,
        notes
      });
    }
    
    // Build query
    const query = {
      ...req.tenantQuery,
      isDeleted: false
    };
    
    if (type) query.type = type;
    if (category) query.category = category;
    if (visibility) query.visibility = visibility;
    if (isTemplate !== undefined) query.isTemplate = isTemplate === 'true';
    if (tags) query.tags = { $in: tags.split(',') };
    
    // Access control
    if (!(req.isSuperAdmin || req.user.role === 'admin')) {
      query.$or = [
        { owner: req.user.userId },
        { visibility: 'company' },
        { visibility: 'department', 'sharedWith.id': req.user.department },
        { visibility: 'team', 'sharedWith.id': req.user.team },
        { 'collaborators.user': req.user.userId }
      ];
    }
    
    const notes = await Note.find(query)
      .populate('owner', 'name email avatar')
      .populate('collaborators.user', 'name email')
      .sort({ isPinned: -1, updatedAt: -1 })
      .limit(100);
    
    res.json({
      success: true,
      count: notes.length,
      notes
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({
      message: 'Error fetching notes',
      error: error.message
    });
  }
});

// Get my notes
router.get('/my-notes', async (req, res) => {
  try {
    const { type, category } = req.query;
    
    const query = {
      ...req.tenantQuery,
      owner: req.user.userId,
      isDeleted: false
    };
    
    if (type) query.type = type;
    if (category) query.category = category;
    
    const notes = await Note.find(query)
      .sort({ isPinned: -1, updatedAt: -1 });
    
    res.json({
      success: true,
      count: notes.length,
      notes
    });
  } catch (error) {
    console.error('Get my notes error:', error);
    res.status(500).json({
      message: 'Error fetching notes',
      error: error.message
    });
  }
});

// Get favorites
router.get('/favorites', async (req, res) => {
  try {
    const notes = await Note.find({
      ...req.tenantQuery,
      favoritedBy: req.user.userId,
      isDeleted: false
    })
      .populate('owner', 'name email avatar')
      .sort({ updatedAt: -1 });
    
    res.json({
      success: true,
      count: notes.length,
      notes
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      message: 'Error fetching favorites',
      error: error.message
    });
  }
});

// Get single note
router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      ...req.tenantQuery,
      isDeleted: false
    })
      .populate('owner', 'name email avatar')
      .populate('collaborators.user', 'name email avatar');
    
    if (!note) {
      return res.status(404).json({
        message: 'Note not found'
      });
    }
    
    // Record view
    await note.recordView();
    
    res.json({
      success: true,
      note
    });
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({
      message: 'Error fetching note',
      error: error.message
    });
  }
});

// Create note
router.post('/', async (req, res) => {
  try {
    const {
      title, content, type, format, category, tags,
      linkedEntities, visibility, sharedWith, isTemplate, templateCategory
    } = req.body;
    
    const note = new Note({
      ...req.tenantQuery,
      title: title.trim(),
      content: content || '',
      type: type || 'note',
      format: format || 'markdown',
      category,
      tags: tags || [],
      linkedEntities: linkedEntities || [],
      visibility: visibility || 'team',
      sharedWith: sharedWith || [],
      isTemplate: isTemplate || false,
      templateCategory,
      owner: req.user.userId,
      collaborators: [{
        user: req.user.userId,
        role: 'owner'
      }]
    });
    
    await note.save();
    
    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      note
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({
      message: 'Error creating note',
      error: error.message
    });
  }
});

// Update note
router.put('/:id', async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      ...req.tenantQuery,
      isDeleted: false
    });
    
    if (!note) {
      return res.status(404).json({
        message: 'Note not found'
      });
    }
    
    // Check permission
    const isOwner = note.owner.toString() === req.user.userId.toString();
    const isEditor = note.collaborators.some(c => 
      c.user.toString() === req.user.userId.toString() && 
      ['owner', 'editor'].includes(c.role)
    );
    
    if (!isOwner && !isEditor) {
      return res.status(403).json({
        message: 'Permission denied'
      });
    }
    
    const { 
      title, content, category, tags, linkedEntities, 
      visibility, sharedWith, changeDescription 
    } = req.body;
    
    // Save version before updating
    await note.saveVersion(req.user.userId, changeDescription);
    
    if (title) note.title = title.trim();
    if (content !== undefined) note.content = content;
    if (category !== undefined) note.category = category;
    if (tags) note.tags = tags;
    if (linkedEntities) note.linkedEntities = linkedEntities;
    if (visibility) note.visibility = visibility;
    if (sharedWith) note.sharedWith = sharedWith;
    
    await note.save();
    
    res.json({
      success: true,
      message: 'Note updated successfully',
      note
    });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({
      message: 'Error updating note',
      error: error.message
    });
  }
});

// Add collaborator
router.post('/:id/collaborators', async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      ...req.tenantQuery,
      isDeleted: false
    });
    
    if (!note) {
      return res.status(404).json({
        message: 'Note not found'
      });
    }
    
    // Only owner can add collaborators
    if (note.owner.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        message: 'Only the note owner can add collaborators'
      });
    }
    
    const { userId, role } = req.body;
    
    await note.addCollaborator(userId, role || 'viewer');
    
    res.json({
      success: true,
      message: 'Collaborator added',
      collaborators: note.collaborators
    });
  } catch (error) {
    console.error('Add collaborator error:', error);
    res.status(500).json({
      message: 'Error adding collaborator',
      error: error.message
    });
  }
});

// Toggle favorite
router.patch('/:id/favorite', async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      ...req.tenantQuery,
      isDeleted: false
    });
    
    if (!note) {
      return res.status(404).json({
        message: 'Note not found'
      });
    }
    
    const isFavorited = note.favoritedBy.some(id => 
      id.toString() === req.user.userId.toString()
    );
    
    if (isFavorited) {
      note.favoritedBy = note.favoritedBy.filter(id => 
        id.toString() !== req.user.userId.toString()
      );
    } else {
      note.favoritedBy.push(req.user.userId);
    }
    
    await note.save();
    
    res.json({
      success: true,
      message: isFavorited ? 'Removed from favorites' : 'Added to favorites',
      isFavorited: !isFavorited
    });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({
      message: 'Error toggling favorite',
      error: error.message
    });
  }
});

// Delete note
router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      ...req.tenantQuery,
      isDeleted: false
    });
    
    if (!note) {
      return res.status(404).json({
        message: 'Note not found'
      });
    }
    
    // Only owner can delete
    if (note.owner.toString() !== req.user.userId.toString() &&
        !(req.isSuperAdmin || req.user.role === 'admin')) {
      return res.status(403).json({
        message: 'Only the note owner can delete'
      });
    }
    
    note.isDeleted = true;
    note.deletedAt = new Date();
    note.deletedBy = req.user.userId;
    await note.save();
    
    res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({
      message: 'Error deleting note',
      error: error.message
    });
  }
});

export default router;
