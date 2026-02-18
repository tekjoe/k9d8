import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  subscribeToNotifications,
  type Notification,
} from '../services/notifications';
import { useAuth } from './useAuth';

export interface UseNotificationsDataReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
}

export function useNotificationsData(options?: {
  limit?: number;
  unreadOnly?: boolean;
}): UseNotificationsDataReturn {
  const { session } = useAuth();
  const userId = session?.user?.id;
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const limit = options?.limit ?? 20;
  const realtimeSubscription = useRef<any>(null);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async (reset = false) => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const currentPage = reset ? 1 : page;
      const data = await getNotifications({
        limit: limit * currentPage,
        unreadOnly: options?.unreadOnly,
      });
      
      setNotifications(data);
      setHasMore(data.length === limit * currentPage);
      
      if (reset) {
        setPage(1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [userId, limit, options?.unreadOnly, page]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;
    
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    if (userId) {
      fetchNotifications(true);
      fetchUnreadCount();
    }
  }, [userId, fetchNotifications, fetchUnreadCount]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!userId) return;
    
    // Subscribe to new notifications
    realtimeSubscription.current = subscribeToNotifications(userId, (newNotification) => {
      setNotifications((prev) => {
        // Check if notification already exists
        if (prev.some((n) => n.id === newNotification.id)) {
          return prev;
        }
        // Add new notification to the top
        return [newNotification, ...prev];
      });
      
      // Increment unread count
      if (!newNotification.read) {
        setUnreadCount((prev) => prev + 1);
      }
    });
    
    return () => {
      if (realtimeSubscription.current) {
        realtimeSubscription.current.unsubscribe();
      }
    };
  }, [userId]);

  // Load more notifications
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
      fetchNotifications();
    }
  }, [loading, hasMore, fetchNotifications]);

  // Refresh notifications
  const refresh = useCallback(async () => {
    await fetchNotifications(true);
    await fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  // Mark a notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      await markNotificationAsRead(id);
      
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      throw err;
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();
      
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
      
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      throw err;
    }
  }, []);

  // Remove a notification
  const removeNotification = useCallback(async (id: string) => {
    try {
      await deleteNotification(id);
      
      const notification = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      
      if (notification && !notification.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
      throw err;
    }
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    markAsRead,
    markAllAsRead,
    removeNotification,
  };
}
