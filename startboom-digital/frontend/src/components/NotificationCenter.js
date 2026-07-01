import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Eye, Trash2, User, Target, Calendar, FileText, DollarSign, ExternalLink } from 'lucide-react';
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
      const interval = setInterval(() => { loadNotifications(); loadUnreadCount(); }, 30000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationsAPI.getAll({ limit: 50 });
      setNotifications(response.data.notifications || []);
    } catch { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      setUnreadCount(response.data.count || 0);
    } catch {}
  };

  const markAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { toast.error('Failed to mark as read'); }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch { toast.error('Failed to mark all as read'); }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationsAPI.delete(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch { toast.error('Failed to delete notification'); }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) await markAsRead(notification._id);
    setSelectedNotification(notification);
  };

  const getNotificationIcon = (type) => {
    if (type?.includes('deal')) return <Target className="w-5 h-5 text-blue-500" />;
    if (type?.includes('client')) return <User className="w-5 h-5 text-green-500" />;
    if (type?.includes('meeting')) return <Calendar className="w-5 h-5 text-purple-500" />;
    if (type?.includes('sale')) return <DollarSign className="w-5 h-5 text-green-500" />;
    if (type?.includes('document')) return <FileText className="w-5 h-5 text-orange-500" />;
    return <Bell className="w-5 h-5 text-gray-500" />;
  };

  const getPriorityBorder = (p) => ({ high: 'border-l-red-500', medium: 'border-l-orange-500', low: 'border-l-green-500' }[p] || 'border-l-gray-400');

  const formatDate = (d) => {
    const h = Math.floor((new Date() - new Date(d)) / 3600000);
    if (h < 1) return 'Just now';
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    return days < 7 ? `${days}d ago` : new Date(d).toLocaleDateString();
  };

  const getEntityPath = (n) => {
    const t = n.type;
    if (t?.includes('deal') || t?.includes('client') || t?.includes('sale') || t?.includes('meeting')) return '/admin/reports';
    return '/admin';
  };

  const handleViewDetails = (notification) => {
    onClose();
    setSelectedNotification(null);
    navigate(getEntityPath(notification));
  };

  if (!isOpen) return null;

  const panelCls = "bg-white dark:bg-[#1A1D27] border border-gray-200 dark:border-[#3A3D52]";
  const headerBorderCls = "border-b border-gray-200 dark:border-[#3A3D52]";
  const textPrimary = "text-gray-900 dark:text-gray-100";
  const textSecondary = "text-gray-600 dark:text-gray-400";
  const textMuted = "text-gray-500 dark:text-gray-500";

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/75 flex items-start justify-end p-4 z-50">
      <div className={`${panelCls} rounded-xl shadow-xl w-full max-w-md h-[80vh] flex flex-col`}>
        {/* Header */}
        <div className="brand-header flex items-center justify-between p-4 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Notifications</h3>
            {unreadCount > 0 && <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{unreadCount}</span>}
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-sm text-white/90 hover:text-white">Mark all read</button>
            )}
            <button onClick={onClose} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className={`flex flex-col items-center justify-center h-32 ${textMuted}`}>
              <Bell className="w-8 h-8 mb-2" /><p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-[#3A3D52]">
              {notifications.map((n) => (
                <div key={n._id} onClick={() => handleNotificationClick(n)}
                  className={`p-4 border-l-4 cursor-pointer transition-colors ${getPriorityBorder(n.priority)} ${!n.isRead ? 'bg-blue-50 dark:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-[#222536]'}`}>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">{getNotificationIcon(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium truncate ${textPrimary}`}>{n.title}</p>
                        <span className={`text-xs ${textMuted}`}>{formatDate(n.createdAt)}</span>
                      </div>
                      <p className={`text-sm mt-1 ${textSecondary}`}>{n.message}</p>
                      {n.actor && <p className={`text-xs mt-1 ${textMuted}`}>by {n.actor.name}</p>}
                    </div>
                    <div className="flex items-center space-x-2">
                      {!n.isRead && (
                        <button onClick={(e) => { e.stopPropagation(); markAsRead(n._id); }} className="text-blue-500 hover:text-blue-400" title="Mark as read">
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); deleteNotification(n._id); }} className="text-red-500 hover:text-red-400" title="Delete">
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
        <div className={`p-4 ${headerBorderCls}`}>
          <button onClick={onClose} className="w-full bg-gray-100 dark:bg-[#2A2D3E] text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-[#222536] transition-colors">
            Close
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50">
          <div className={`${panelCls} rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getNotificationIcon(selectedNotification.type)}
                  <h3 className={`text-lg font-semibold ${textPrimary}`}>Notification Details</h3>
                </div>
                <button onClick={() => setSelectedNotification(null)} className={`${textMuted} hover:text-gray-700 dark:hover:text-gray-200`}><X className="w-6 h-6" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className={`font-medium ${textPrimary}`}>{selectedNotification.title}</h4>
                  <p className={`mt-1 ${textSecondary}`}>{selectedNotification.message}</p>
                </div>
                {selectedNotification.actor && (
                  <div className="flex items-center space-x-2">
                    <User className={`w-4 h-4 ${textMuted}`} />
                    <span className={`text-sm ${textSecondary}`}>By: {selectedNotification.actor.name}</span>
                  </div>
                )}
                {selectedNotification.metadata && Object.keys(selectedNotification.metadata).length > 0 && (
                  <div className="bg-gray-50 dark:bg-[#2A2D3E] border border-gray-200 dark:border-[#3A3D52] p-3 rounded-lg">
                    <h5 className={`font-medium mb-2 ${textPrimary}`}>Details:</h5>
                    <div className="space-y-1 text-sm">
                      {Object.entries(selectedNotification.metadata).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className={`capitalize ${textSecondary}`}>{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
                          <span className={`font-medium ${textPrimary}`}>{typeof value === 'number' ? value.toLocaleString() : value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-500">
                  <span>{new Date(selectedNotification.createdAt).toLocaleString()}</span>
                  <span>•</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${selectedNotification.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' : selectedNotification.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'}`}>
                    {selectedNotification.priority || 'low'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col space-y-3 mt-6">
                <button onClick={() => handleViewDetails(selectedNotification)}
                  className="w-full flex items-center justify-center space-x-2 bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 transition-colors">
                  <ExternalLink className="w-4 h-4" /><span>View Details</span>
                </button>
                <div className="flex space-x-3">
                  <button onClick={() => setSelectedNotification(null)}
                    className="flex-1 bg-gray-100 dark:bg-[#2A2D3E] text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-[#222536] transition-colors">
                    Close
                  </button>
                  {!selectedNotification.isRead && (
                    <button onClick={() => { markAsRead(selectedNotification._id); setSelectedNotification(null); }}
                      className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
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
