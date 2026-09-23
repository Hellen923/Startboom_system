// routes/messages.js
import express from 'express';
import { auth } from '../middleware/auth.js';
import { tenantAuth } from '../middleware/tenantAuth.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import Team from '../models/Team.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Get all conversations for current user
router.get('/conversations', auth, tenantAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    
    // Find conversations where user is participant or part of team/department
    const conversations = await Conversation.find({
      tenant: tenantId,
      $or: [
        { participants: userId }, // Direct messages
        { team: { $in: [req.user.team] } }, // Team chat
        { department: { $in: [req.user.department] } } // Department chat
      ],
      isActive: true
    })
    .populate('lastMessage')
    .populate('participants', 'name email')
    .populate('team', 'name')
    .populate('department', 'name')
    .sort({ lastMessageAt: -1 })
    .limit(50);
    
    // Add unread count for each conversation
    const conversationsWithUnread = conversations.map(conv => ({
      ...conv.toObject(),
      unreadCount: conv.getUnreadCount(userId)
    }));
    
    res.json({ conversations: conversationsWithUnread });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
});

// Get messages for a specific conversation
router.get('/conversation/:conversationId', auth, tenantAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, before } = req.query;
    const userId = req.user.userId;
    
    // Verify user has access to this conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      tenant: req.user.tenantId
    });
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Check if user is participant
    const isParticipant = conversation.participants.some(
      p => p.toString() === userId.toString()
    );
    
    if (!isParticipant && conversation.type === 'direct') {
      return res.status(403).json({ message: 'Access denied to this conversation' });
    }
    
    // Build query
    const query = {
      conversation: conversationId,
      isDeleted: false
    };
    
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }
    
    // Fetch messages
    const messages = await Message.find(query)
      .populate('sender', 'name email')
      .populate('replyTo')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    // Mark messages as read
    const unreadMessages = messages.filter(
      m => m.sender.toString() !== userId.toString() && !m.isRead
    );
    
    await Promise.all(
      unreadMessages.map(m => m.markAsRead(userId))
    );
    
    // Reset unread count for this conversation
    await conversation.resetUnread(userId);
    
    res.json({ 
      messages: messages.reverse(), // Oldest first
      conversation 
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// Send a message
router.post('/send', auth, tenantAuth, async (req, res) => {
  try {
    const { conversationId, content, type = 'text', fileUrl, fileName, replyTo } = req.body;
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    
    if (!content || !conversationId) {
      return res.status(400).json({ message: 'Content and conversation ID are required' });
    }
    
    // Verify conversation exists
    const conversation = await Conversation.findOne({
      _id: conversationId,
      tenant: tenantId
    });
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Create message
    const message = await Message.create({
      tenant: tenantId,
      conversation: conversationId,
      sender: userId,
      content,
      type,
      fileUrl,
      fileName,
      replyTo,
      status: 'sent'
    });
    
    // Update conversation last message and unread counts
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    
    // Increment unread count for other participants
    const recipients = conversation.participants.filter(
      p => p.toString() !== userId.toString()
    );
    
    recipients.forEach(recipientId => {
      const recipientIdStr = recipientId.toString();
      const current = conversation.unreadCounts.get(recipientIdStr) || 0;
      conversation.unreadCounts.set(recipientIdStr, current + 1);
    });
    
    // Save conversation once with all updates
    await conversation.save();
    
    // Create notifications for recipients
    const sender = await User.findById(userId).select('name');
    const notificationPromises = recipients.map(recipientId =>
      Notification.create({
        tenant: tenantId,
        user: recipientId,
        type: 'team_message',
        title: `New message from ${sender.name}`,
        message: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
        link: `/messages/${conversationId}`,
        relatedEntity: 'message',
        entityId: message._id,
        isRead: false
      })
    );
    
    await Promise.all(notificationPromises);
    
    // Populate sender for response
    await message.populate('sender', 'name email');
    
    res.status(201).json({ message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// Send message to entire team
router.post('/team/:teamId', auth, tenantAuth, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    
    if (!content) {
      return res.status(400).json({ message: 'Message content is required' });
    }
    
    // Verify team exists and user has access
    const team = await Team.findOne({
      _id: teamId,
      tenant: tenantId
    }).populate('members.user', 'name email');
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    // Check if user is team member or team lead
    const isMember = team.members.some(m => m.user._id.toString() === userId.toString());
    const isTeamLead = team.teamLead && team.teamLead.toString() === userId.toString();
    
    if (!isMember && !isTeamLead) {
      return res.status(403).json({ message: 'You are not a member of this team' });
    }
    
    // Find or create team conversation
    const conversation = await Conversation.findOrCreateTeam(tenantId, teamId, userId);
    conversation.name = `${team.name} Chat`;
    await conversation.save();
    
    // Add all team members as participants if not already
    const memberIds = team.members.map(m => m.user._id);
    conversation.participants = [...new Set([...conversation.participants.map(p => p.toString()), ...memberIds.map(id => id.toString())])];
    await conversation.save();
    
    // Create message
    const message = await Message.create({
      tenant: tenantId,
      conversation: conversation._id,
      sender: userId,
      content,
      type: 'text',
      status: 'sent'
    });
    
    // Update conversation last message
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    await conversation.save();
    
    // Notify all team members except sender
    const sender = await User.findById(userId).select('name');
    const recipients = memberIds.filter(id => id.toString() !== userId.toString());
    
    const notificationPromises = recipients.map(recipientId =>
      Notification.create({
        tenant: tenantId,
        user: recipientId,
        type: 'team_message',
        title: `${sender.name} in ${team.name}`,
        message: content.substring(0, 100),
        link: `/messages/${conversation._id}`,
        relatedEntity: 'message',
        entityId: message._id,
        isRead: false
      })
    );
    
    await Promise.all(notificationPromises);
    
    res.status(201).json({ message, conversation });
  } catch (error) {
    console.error('Error sending team message:', error);
    res.status(500).json({ message: 'Failed to send team message' });
  }
});

// Create or get direct conversation with a user
router.post('/direct/:recipientId', auth, tenantAuth, async (req, res) => {
  try {
    const { recipientId } = req.params;
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    
    // Verify recipient exists in same tenant
    const recipient = await User.findOne({
      _id: recipientId,
      tenant: tenantId
    }).select('name email');
    
    if (!recipient) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Find or create conversation
    const conversation = await Conversation.findOrCreateDirect(
      tenantId,
      userId,
      recipientId
    );
    
    // Populate participants
    await conversation.populate('participants', 'name email');
    
    res.json({ conversation });
  } catch (error) {
    console.error('Error creating direct conversation:', error);
    res.status(500).json({ message: 'Failed to create conversation' });
  }
});

// Mark message as read
router.put('/:messageId/read', auth, tenantAuth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;
    
    const message = await Message.findOne({
      _id: messageId,
      tenant: req.user.tenantId
    });
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    await message.markAsRead(userId);
    
    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: 'Failed to mark message as read' });
  }
});

// Get unread message count
router.get('/unread-count', auth, tenantAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    
    // Get all conversations for user
    const conversations = await Conversation.find({
      tenant: tenantId,
      $or: [
        { participants: userId },
        { team: { $in: [req.user.team] } },
        { department: { $in: [req.user.department] } }
      ],
      isActive: true
    });
    
    // Sum up unread counts
    let totalUnread = 0;
    conversations.forEach(conv => {
      totalUnread += conv.getUnreadCount(userId);
    });
    
    res.json({ unreadCount: totalUnread });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Failed to fetch unread count' });
  }
});

// Delete message (soft delete)
router.delete('/:messageId', auth, tenantAuth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;
    
    const message = await Message.findOne({
      _id: messageId,
      tenant: req.user.tenantId,
      sender: userId // Can only delete own messages
    });
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found or not authorized' });
    }
    
    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();
    
    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Failed to delete message' });
  }
});

export default router;
