'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import {
  PushNotification,
  NotificationUpdatePayload,
  NotificationCountPayload,
} from '@/types/push-notifications.types';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/services/push-notifications.service';

interface PushNotificationsContextValue {
  notifications: PushNotification[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  refreshNotifications: () => Promise<void>;
}

const PushNotificationsContext = createContext<PushNotificationsContextValue | null>(null);

interface PushNotificationsProviderProps {
  children: React.ReactNode;
  authToken?: string;
  enabled?: boolean;
}

export function PushNotificationsProvider({ children, authToken, enabled = true }: PushNotificationsProviderProps) {
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch initial notifications on mount
  const fetchNotifications = useCallback(async () => {
    if (!authToken) return;

    setIsLoading(true);
    try {
      const data = await getNotifications(authToken, { limit: 50 });
      setNotifications(
        data.notifications.map((n) => ({
          ...n,
          id: n.uid ?? n.id, // Normalize id field
        })),
      );
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    if (enabled && authToken) {
      fetchNotifications();
    }
  }, [enabled, authToken, fetchNotifications]);

  // Handle new notification from WebSocket
  const handleNewNotification = useCallback((notification: PushNotification) => {
    setNotifications((prev) => {
      // Avoid duplicates
      const notificationId = notification.id;
      if (prev.some((n) => n.id === notificationId)) {
        return prev;
      }
      return [{ ...notification, isRead: false }, ...prev];
    });
    setUnreadCount((prev) => prev + 1);
  }, []);

  // Handle notification update from WebSocket (sync across devices)
  const handleNotificationUpdate = useCallback((payload: NotificationUpdatePayload) => {
    if (payload.status === 'read') {
      setNotifications((prev) => prev.map((n) => (n.id === payload.id ? { ...n, isRead: true } : n)));
      // Recalculate unread count to stay in sync
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } else if (payload.status === 'deleted') {
      setNotifications((prev) => {
        const notification = prev.find((n) => n.id === payload.id);
        if (notification && !notification.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== payload.id);
      });
    }
  }, []);

  // Handle count update from WebSocket
  const handleCountUpdate = useCallback((payload: NotificationCountPayload) => {
    setUnreadCount(payload.unreadCount);
    if (payload.unreadCount === 0) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  }, []);

  const {
    isConnected,
    error,
    markAsRead: wsMarkAsRead,
    markAllAsRead: wsMarkAllAsRead,
  } = usePushNotifications({
    token: authToken,
    enabled: enabled && Boolean(authToken),
    onNewNotification: handleNewNotification,
    onNotificationUpdate: handleNotificationUpdate,
    onCountUpdate: handleCountUpdate,
  });

  // Mark single notification as read
  const markAsRead = useCallback(
    async (id: string) => {
      const notification = notifications.find((n) => n.id === id);
      if (!notification || notification.isRead) return;

      // Optimistic update
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Call REST API
      if (authToken) {
        try {
          await markNotificationAsRead(authToken, id);
        } catch (err) {
          console.error('Failed to mark notification as read:', err);
          // Revert optimistic update on error
          setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)));
          setUnreadCount((prev) => prev + 1);
        }
      }

      // Notify other devices via WebSocket
      wsMarkAsRead(id);
    },
    [notifications, authToken, wsMarkAsRead],
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    const hadUnread = notifications.some((n) => !n.isRead);
    if (!hadUnread) return;

    // Optimistic update
    const previousNotifications = [...notifications];
    const previousCount = unreadCount;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    // Call REST API
    if (authToken) {
      try {
        await markAllNotificationsAsRead(authToken);
      } catch (err) {
        console.error('Failed to mark all notifications as read:', err);
        // Revert optimistic update on error
        setNotifications(previousNotifications);
        setUnreadCount(previousCount);
      }
    }

    // Notify other devices via WebSocket
    wsMarkAllAsRead();
  }, [notifications, unreadCount, authToken, wsMarkAllAsRead]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      isConnected,
      isLoading,
      error,
      markAsRead,
      markAllAsRead,
      refreshNotifications: fetchNotifications,
    }),
    [notifications, unreadCount, isConnected, isLoading, error, markAsRead, markAllAsRead, fetchNotifications],
  );

  return <PushNotificationsContext.Provider value={value}>{children}</PushNotificationsContext.Provider>;
}

export function usePushNotificationsContext(): PushNotificationsContextValue {
  const context = useContext(PushNotificationsContext);
  if (!context) {
    throw new Error('usePushNotificationsContext must be used within a PushNotificationsProvider');
  }
  return context;
}
