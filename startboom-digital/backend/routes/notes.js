// routes/notes.js
import express from 'express';
import Note from '../models/Note.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get all notes (with filters)
router.get('/', auth, async (req, res) => {
  try {
    const { type, category, visibility, isTemplate, tags, search } = req.query;
    
    // Use text search if search query provided
    if (search) {
      const notes = await Note.searchNotes(req.user.tenant, search, {
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
      tenant: req.user.tenant,
      isDeleted: false
    };
    
    if (type) query.type = type;
    if (category) query.category = category;
    if (visibility) query.visibility = visibility;
    if (isTemplate !== undefined) query.isTemplate = isTemplate === 'true';
    if (tags) query.tags = { $in: tags.split(',') };
    
    // Access control
    if (!['superadmin', 'admin'].includes(req.user.role)) {
      query.$or = [
        { owner: req.user._id },
        { visibility: 'company' },
        { visibility: 'department', 'sharedWith.id': req.user.department },
        { visibility: 'team', 'sharedWith.id': req.user.team },
        { 'collaborators.user': req.user._id }
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
router.get('/my-notes', auth, async (req, res) => {
  try {
    const { type, category } = req.query;
    
    const query = {
      tenant: req.user.tenant,
      owner: req.user._id,
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
router.get('/favorites', auth, async (req, res) => {
  try {
    const notes = await Note.find({
      tenant: req.user.tenant,
      favoritedBy: req.user._id,
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
router.get('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
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
router.post('/', auth, async (req, res) => {
  try {
    const {
      title, content, type, format, category, tags,
      linkedEntities, visibility, sharedWith, isTemplate, templateCategory
    } = req.body;
    
    const note = new Note({
      tenant: req.user.tenant,
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
      owner: req.user._id,
      collaborators: [{
        user: req.user._id,
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
router.put('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
      isDeleted: false
    });
    
    if (!note) {
      return res.status(404).json({
        message: 'Note not found'
      });
    }
    
    // Check permission
    const isOwner = note.owner.toString() === req.user._id.toString();
    const isEditor = note.collaborators.some(c => 
      c.user.toString() === req.user._id.toString() && 
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
    await note.saveVersion(req.user._id, changeDescription);
    
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
router.post('/:id/collaborators', auth, async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
      isDeleted: false
    });
    
    if (!note) {
      return res.status(404).json({
        message: 'Note not found'
      });
    }
    
    // Only owner can add collaborators
    if (note.owner.toString() !== req.user._id.toString()) {
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
router.patch('/:id/favorite', auth, async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
      isDeleted: false
    });
    
    if (!note) {
      return res.status(404).json({
        message: 'Note not found'
      });
    }
    
    const isFavorited = note.favoritedBy.some(id => 
      id.toString() === req.user._id.toString()
    );
    
    if (isFavorited) {
      note.favoritedBy = note.favoritedBy.filter(id => 
        id.toString() !== req.user._id.toString()
      );
    } else {
      note.favoritedBy.push(req.user._id);
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
router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
      isDeleted: false
    });
    
    if (!note) {
      return res.status(404).json({
        message: 'Note not found'
      });
    }
    
    // Only owner can delete
    if (note.owner.toString() !== req.user._id.toString() &&
        !['superadmin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Only the note owner can delete'
      });
    }
    
    note.isDeleted = true;
    note.deletedAt = new Date();
    note.deletedBy = req.user._id;
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
