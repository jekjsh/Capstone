import { useEffect, useState } from 'react';
import { Bell, X, UserPlus, Check, AlertCircle, RefreshCcw } from 'lucide-react';
import { notificationAPI } from '../../services/api';

export default function SystemAdminNotifications({ currentUser, onRequestsUpdate }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch request notifications on mount and periodically
  useEffect(() => {
    loadNotifications();
    // Check for new notifications every 30 seconds
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      // Sync pending user creation requests into notifications before reading list.
      await notificationAPI.generateNotifications();
      // Fetch actual notifications from backend
      const rawNotifications = await notificationAPI.getAll();
      const normalizedNotifications = (rawNotifications || []).map((item) => ({
        id: item?.notif_id ?? item?.id,
        type: item?.type || 'pending_requests',
        title: item?.title || 'New User Creation Request',
        message: item?.message || item?.notif_msg || 'A new user creation request is waiting for review.',
        timestamp: item?.timestamp || item?.created_at,
        is_read: Boolean(item?.is_read),
      })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Keep only the latest notification per message to avoid showing duplicates.
      const dedupedNotifications = [];
      const seenMessages = new Set();
      for (const notification of normalizedNotifications) {
        if (seenMessages.has(notification.message)) {
          continue;
        }
        seenMessages.add(notification.message);
        dedupedNotifications.push(notification);
      }

      setNotifications(dedupedNotifications);
      const unread = dedupedNotifications.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading request notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkRead = async (notificationId) => {
    try {
      // Call API to persist read status
      await notificationAPI.markRead(notificationId);
      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      await loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      // Call API to persist read status
      await notificationAPI.markAllRead();
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      await loadNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await notificationAPI.delete(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      await loadNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'pending_requests':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'request_claimed':
        return <UserPlus className="w-5 h-5 text-blue-500" />;
      case 'request_approved':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'request_denied':
        return <X className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationBgColor = (type, isRead) => {
    if (isRead) return 'bg-white';
    switch (type) {
      case 'pending_requests':
        return 'bg-orange-50';
      case 'request_claimed':
        return 'bg-blue-50';
      case 'request_approved':
        return 'bg-green-50';
      case 'request_denied':
        return 'bg-red-50';
      default:
        return 'bg-gray-50';
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getRequestIdFromMessage = (message) => {
    const text = message || '';
    const match = text.match(/request\s+([A-Za-z0-9-]+)/i);
    return match ? match[1] : null;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
        title="Notifications"
      >
        <Bell className="w-6 h-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowNotifications(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-20 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 rounded-t-lg">
              <h3 className="font-semibold text-gray-800">Request Notifications</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={loadNotifications}
                  className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
                  title="Refresh notifications"
                  disabled={isLoading}
                >
                  <RefreshCcw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-blue-600 hover:text-blue-700"
                    title="Mark all as read"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No request notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 ${getNotificationBgColor(notification.type, notification.is_read)} hover:bg-gray-50 transition-colors cursor-pointer`}
                      onClick={() => {
                        if (!notification.is_read) {
                          handleMarkRead(notification.id);
                        }
                        // Navigate to requests page
                        if (onRequestsUpdate) {
                          onRequestsUpdate(getRequestIdFromMessage(notification.message));
                          setShowNotifications(false);
                        }
                      }}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-semibold ${!notification.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                              {notification.title}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNotification(notification.id);
                              }}
                              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {formatTimeAgo(notification.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg text-center">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    if (onRequestsUpdate) onRequestsUpdate();
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all requests
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
