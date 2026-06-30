import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Eye, Trash2, CheckCircle, AlertCircle, User, Target, Calendar, FileText, DollarSign, ExternalLink } from 'lucide-react';
import { notificationsAPI } from '../services/api';
import toast from 'react-hot-toast';

const NotificationCenter = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      loadUnreadCount();

      // Auto-refresh notifications every 30 seconds when panel is open
      const interval = setInterval(() => {
        loadNotifications();
        loadUnreadCount();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationsAPI.getAll({ limit: 50 });
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === id ? { ...notif, isRead: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    // Set selected notification to show details
    setSelectedNotification(notification);
  };

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationsAPI.delete(id);
      setNotifications(prev => prev.filter(notif => notif._id !== id));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'deal_created':
      case 'deal_updated':
      case 'deal_won':
      case 'deal_lost':
        return <Target className="w-5 h-5 text-blue-500" />;
      case 'client_created':
      case 'client_updated':
        return <User className="w-5 h-5 text-green-500" />;
      case 'meeting_created':
      case 'meeting_completed':
        return <Calendar className="w-5 h-5 text-purple-500" />;
      case 'sale_created':
        return <DollarSign className="w-5 h-5 text-green-500" />;
      case 'document_uploaded':
        return <FileText className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-orange-500';
      case 'low':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  };

  // Get navigation path based on notification type
  const getEntityPath = (notification) => {
    const entityType = notification.entityType?.toLowerCase();
    const type = notification.type;

    // Map notification types to admin routes
    if (type?.includes('deal') || entityType === 'deal') {
      return '/admin/reports'; // Admin can view deals in reports
    }
    if (type?.includes('client') || entityType === 'client') {
      return '/admin/reports'; // Admin can view clients in reports
    }
    if (type?.includes('sale') || entityType === 'sale') {
      return '/admin/reports'; // Admin can view sales in reports
    }
    if (type?.includes('meeting') || entityType === 'meeting' || entityType === 'schedule') {
      return '/admin/reports'; // Admin can view schedules in reports
    }
    return '/admin'; // Default to admin dashboard
  };

  const handleViewDetails = (notification) => {
    const path = getEntityPath(notification);
    onClose(); // Close the notification center
    setSelectedNotification(null);
    navigate(path);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-end p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-orange-500 hover:text-orange-600"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <Bell className="w-8 h-8 mb-2" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-l-4 hover:bg-gray-50 transition-colors cursor-pointer ${getPriorityColor(notification.priority)
                    } ${!notification.isRead ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-500">
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      {notification.actor && (
                        <p className="text-xs text-gray-500 mt-1">
                          by {notification.actor.name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {!notification.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification._id);
                          }}
                          className="text-blue-500 hover:text-blue-600"
                          title="Mark as read"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification._id);
                        }}
                        className="text-red-500 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getNotificationIcon(selectedNotification.type)}
                  <h3 className="text-lg font-semibold text-gray-900">
                    Notification Details
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">{selectedNotification.title}</h4>
                  <p className="text-gray-600 mt-1">{selectedNotification.message}</p>
                </div>

                {selectedNotification.actor && (
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      By: {selectedNotification.actor.name}
                    </span>
                  </div>
                )}

                {selectedNotification.metadata && Object.keys(selectedNotification.metadata).length > 0 && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-2">Details:</h5>
                    <div className="space-y-1 text-sm">
                      {Object.entries(selectedNotification.metadata).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-600 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                          </span>
                          <span className="text-gray-900 font-medium">
                            {typeof value === 'number' ? value.toLocaleString() : value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>{new Date(selectedNotification.createdAt).toLocaleString()}</span>
                  <span>•</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${selectedNotification.priority === 'high' ? 'bg-red-100 text-red-800' :
                    selectedNotification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                    {selectedNotification.priority || 'low'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col space-y-3 mt-6">
                <button
                  onClick={() => handleViewDetails(selectedNotification)}
                  className="w-full flex items-center justify-center space-x-2 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View Details</span>
                </button>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setSelectedNotification(null)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                  {!selectedNotification.isRead && (
                    <button
                      onClick={() => {
                        markAsRead(selectedNotification._id);
                        setSelectedNotification(null);
                      }}
                      className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;

