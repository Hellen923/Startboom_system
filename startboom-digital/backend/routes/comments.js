// routes/comments.js
import express from 'express';
import Comment from '../models/Comment.js';
import Notification from '../models/Notification.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get comments for entity
router.get('/entity/:entityType/:entityId', auth, async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { includeReplies = 'true', limit = 50, skip = 0 } = req.query;
    
    const comments = await Comment.getEntityComments(
      entityType,
      entityId,
      {
        includeReplies: includeReplies === 'true',
        limit: parseInt(limit),
        skip: parseInt(skip)
      }
    );
    
    res.json({
      success: true,
      count: comments.length,
      comments
    });
  } catch (error) {
    console.error('Get entity comments error:', error);
    res.status(500).json({
      message: 'Error fetching comments',
      error: error.message
    });
  }
});

// Get single comment with thread
router.get('/:id/thread', auth, async (req, res) => {
  try {
    const thread = await Comment.getThread(req.params.id);
    
    if (!thread) {
      return res.status(404).json({
        message: 'Comment not found'
      });
    }
    
    res.json({
      success: true,
      thread
    });
  } catch (error) {
    console.error('Get comment thread error:', error);
    res.status(500).json({
      message: 'Error fetching comment thread',
      error: error.message
    });
  }
});

// Create comment
router.post('/', auth, async (req, res) => {
  try {
    const { 
      entityType, entityId, content, parentComment, 
      mentions, attachments, format, isInternal 
    } = req.body;
    
    // Calculate thread depth
    let threadDepth = 0;
    if (parentComment) {
      const parent = await Comment.findById(parentComment);
      if (parent) {
        threadDepth = parent.threadDepth + 1;
      }
    }
    
    const comment = new Comment({
      tenant: req.user.tenant,
      entityType,
      entityId,
      author: req.user._id,
      content: content.trim(),
      parentComment,
      threadDepth,
      mentions: mentions || [],
      attachments: attachments || [],
      format: format || 'plain',
      isInternal: isInternal !== undefined ? isInternal : true
    });
    
    await comment.save();
    await comment.populate('author', 'name email avatar');
    
    // Send notifications to mentioned users
    if (mentions && mentions.length > 0) {
      for (const mention of mentions) {
        await Notification.create({
          tenant: req.user.tenant,
          user: mention.user,
          title: 'You were mentioned in a comment',
          message: `${req.user.name} mentioned you: "${content.substring(0, 100)}..."`,
          type: 'mention',
          relatedEntity: entityId,
          relatedEntityType: entityType
        });
        
        // Mark as notified
        const commentMention = comment.mentions.find(m => 
          m.user.toString() === mention.user.toString()
        );
        if (commentMention) {
          commentMention.notified = true;
        }
      }
      await comment.save();
    }
    
    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      comment
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      message: 'Error creating comment',
      error: error.message
    });
  }
});

// Update comment
router.put('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });
    
    if (!comment) {
      return res.status(404).json({
        message: 'Comment not found'
      });
    }
    
    // Only author can edit
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Only the comment author can edit'
      });
    }
    
    const { content } = req.body;
    
    await comment.edit(content, req.user._id);
    await comment.populate('author', 'name email avatar');
    
    res.json({
      success: true,
      message: 'Comment updated successfully',
      comment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      message: 'Error updating comment',
      error: error.message
    });
  }
});

// Add reaction
router.post('/:id/reactions', auth, async (req, res) => {
  try {
    const { emoji } = req.body;
    
    const comment = await Comment.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });
    
    if (!comment) {
      return res.status(404).json({
        message: 'Comment not found'
      });
    }
    
    await comment.addReaction(emoji, req.user._id);
    
    res.json({
      success: true,
      message: 'Reaction added',
      reactions: comment.reactions
    });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({
      message: 'Error adding reaction',
      error: error.message
    });
  }
});

// Remove reaction
router.delete('/:id/reactions/:emoji', auth, async (req, res) => {
  try {
    const comment = await Comment.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });
    
    if (!comment) {
      return res.status(404).json({
        message: 'Comment not found'
      });
    }
    
    await comment.removeReaction(req.params.emoji, req.user._id);
    
    res.json({
      success: true,
      message: 'Reaction removed',
      reactions: comment.reactions
    });
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({
      message: 'Error removing reaction',
      error: error.message
    });
  }
});

// Pin/unpin comment
router.patch('/:id/pin', auth, async (req, res) => {
  try {
    // Only admins/managers can pin
    if (!['superadmin', 'admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Only administrators and managers can pin comments'
      });
    }
    
    const comment = await Comment.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });
    
    if (!comment) {
      return res.status(404).json({
        message: 'Comment not found'
      });
    }
    
    comment.isPinned = !comment.isPinned;
    comment.pinnedAt = comment.isPinned ? new Date() : null;
    await comment.save();
    
    res.json({
      success: true,
      message: comment.isPinned ? 'Comment pinned' : 'Comment unpinned',
      isPinned: comment.isPinned
    });
  } catch (error) {
    console.error('Pin comment error:', error);
    res.status(500).json({
      message: 'Error pinning comment',
      error: error.message
    });
  }
});

// Delete comment
router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });
    
    if (!comment) {
      return res.status(404).json({
        message: 'Comment not found'
      });
    }
    
    // Only author or admin can delete
    if (comment.author.toString() !== req.user._id.toString() &&
        !['superadmin', 'admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Permission denied'
      });
    }
    
    comment.isDeleted = true;
    comment.deletedAt = new Date();
    comment.deletedBy = req.user._id;
    await comment.save();
    
    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      message: 'Error deleting comment',
      error: error.message
    });
  }
});

export default router;
