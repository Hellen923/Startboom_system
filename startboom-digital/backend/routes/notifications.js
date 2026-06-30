// routes/notifications.js
import express from 'express';
import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import { tenantAuth } from '../middleware/tenantAuth.js';

const router = express.Router();

// Apply tenant-aware middleware to all routes
router.use(tenantAuth);

// Get notifications for current user (admin)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, isRead, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Convert userId to ObjectId for proper MongoDB matching
    const recipientId = new mongoose.Types.ObjectId(req.user.userId);
    let query = { recipient: recipientId, ...req.tenantQuery };

    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    if (type) {
      query.type = type;
    }

    const notifications = await Notification.find(query)
      .populate('actor', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);

    res.json({
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: skip + notifications.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get unread notification count
router.get('/unread-count', async (req, res) => {
  try {
    const recipientId = new mongoose.Types.ObjectId(req.user.userId);
    const count = await Notification.countDocuments({
      recipient: recipientId,
      isRead: false,
      ...req.tenantQuery
    });

    res.json({ count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const recipientId = new mongoose.Types.ObjectId(req.user.userId);
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: recipientId, ...req.tenantQuery },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', async (req, res) => {
  try {
    const recipientId = new mongoose.Types.ObjectId(req.user.userId);
    const result = await Notification.updateMany(
      { recipient: recipientId, isRead: false, ...req.tenantQuery },
      { isRead: true }
    );

    res.json({ message: `${result.modifiedCount} notifications marked as read` });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const recipientId = new mongoose.Types.ObjectId(req.user.userId);
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: recipientId,
      ...req.tenantQuery
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get notification stats
router.get('/stats/summary', async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const tenantId = new mongoose.Types.ObjectId(req.user.tenantId);

    const stats = await Notification.aggregate([
      { $match: { recipient: userId, tenant: tenantId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: {
            $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
          },
          byType: {
            $push: '$type'
          }
        }
      }
    ]);

    const typeStats = await Notification.aggregate([
      { $match: { recipient: userId, tenant: tenantId } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          unread: {
            $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      summary: stats[0] || { total: 0, unread: 0 },
      byType: typeStats
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export { router as notificationRoutes };

