'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';

import { usePushNotifications } from '@/hooks/usePushNotifications';
import {
  PushNotification,
  NotificationUpdatePayload,
  NotificationCountPayload,
} from '@/types/push-notifications.types';
import {
  getUnreadLinks,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/services/push-notifications.service';

import { UnreadLinksMap } from './types';

import { sanitizeNotification, normalizeLink, addUnreadLinkEntry, removeUnreadLinkUid } from './utils';

import { useAutoMarkOnNavigation } from './hooks/useAutoMarkOnNavigation';
import { useGetPathToCompareNotificationLink } from './hooks/useGetPathToCompareNotificationLink';

import { PushNotificationsContext } from './PushNotificationsContext';

interface PushNotificationsProviderProps {
  children: React.ReactNode;
  authToken?: string;
  enabled?: boolean;
}

export function PushNotificationsProvider({ children, authToken, enabled = true }: PushNotificationsProviderProps) {
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Normalized link → set of notification UIDs for auto-marking on navigation
  const unreadLinksMapRef = useRef<UnreadLinksMap>(new Map());

  const pathToCompareNotyLink = useGetPathToCompareNotificationLink();

  // Ref for wsMarkAsRead — breaks the circular dependency between handleNewNotification and usePushNotifications
  const wsMarkAsReadRef = useRef<(id: string) => void>(() => {});

  const fetchUnreadLinks = useCallback(async () => {
    if (!authToken) {
      return;
    }

    try {
      const links = await getUnreadLinks(authToken);
      const map = new Map<string, Set<string>>();
      for (const entry of links) {
        addUnreadLinkEntry(entry, map);
      }
      unreadLinksMapRef.current = map;
    } catch (err) {
      console.error('Failed to fetch unread links:', err);
    }
  }, [authToken]);

  // Fetch initial notifications on mount
  const fetchNotifications = useCallback(async () => {
    if (!authToken) {
      return;
    }

    setIsLoading(true);
    try {
      await fetchUnreadLinks();

      const data = await getNotifications(authToken, { limit: 50 });
      setNotifications(
        data.notifications.map((n) =>
          sanitizeNotification({
            ...n,
            id: n.uid ?? n.id, // Normalize id field
          }),
        ),
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
  const handleNewNotification = useCallback(
    (notification: PushNotification) => {
      const { link } = notification;
      const uid = notification.uid ?? notification.id;

      // Mark notification as "read" if we are on the page that is mentioned in the notification
      if (uid && link && authToken) {
        const normalized = normalizeLink(link);

        if (normalized === pathToCompareNotyLink) {
          markNotificationAsRead(authToken, uid)
            .then(() => fetchNotifications())
            .catch((err) => console.error('Failed to auto-mark notification:', err));
          wsMarkAsReadRef.current(uid);

          return;
        }
      }

      const sanitized = sanitizeNotification(notification);
      setNotifications((prev) => {
        // Avoid duplicates
        const notificationId = sanitized.id;
        if (prev.some((n) => n.id === notificationId)) {
          return prev;
        }
        return [{ ...sanitized, isRead: false }, ...prev];
      });
      setUnreadCount((prev) => prev + 1);

      if (uid && link) {
        addUnreadLinkEntry({ uid, link }, unreadLinksMapRef.current);
      }
    },
    [authToken, fetchNotifications, pathToCompareNotyLink],
  );

  // Handle notification update from WebSocket (sync across devices)
  const handleNotificationUpdate = useCallback((payload: NotificationUpdatePayload) => {
    if (payload.status === 'deleted') {
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

  // Track previous connection state to detect reconnections
  const wasConnectedRef = useRef(isConnected);

  // Refetch notifications on WebSocket reconnect to catch any missed events
  useEffect(() => {
    const wasDisconnected = !wasConnectedRef.current;
    const isNowConnected = isConnected;

    // Update ref for next comparison
    wasConnectedRef.current = isConnected;

    // If we just reconnected (was disconnected, now connected), refetch notifications
    if (wasDisconnected && isNowConnected && authToken) {
      void fetchNotifications();
    }
  }, [isConnected, authToken, fetchNotifications]);

  // Keep wsMarkAsReadRef in sync
  wsMarkAsReadRef.current = wsMarkAsRead;

  // Auto-mark notifications as read when user navigates to a matching page
  useAutoMarkOnNavigation({
    authToken,
    unreadLinksMapRef,
    wsMarkAsReadRef,
    fetchNotifications,
  });

  // Mark single notification as read
  const markAsRead = useCallback(
    async (id: string) => {
      const notification = notifications.find((n) => n.id === id);
      if (!notification || notification.isRead) return;

      // Call REST API
      if (authToken) {
        try {
          await markNotificationAsRead(authToken, id);
          await fetchNotifications();
        } catch (err) {
          console.error('Failed to mark notification as read:', err);
          // Revert optimistic update on error
          setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)));
          setUnreadCount((prev) => prev + 1);
        }
      }

      // Notify other devices via WebSocket
      wsMarkAsRead(id);

      // Remove from unread links map so auto-marking won't re-trigger
      removeUnreadLinkUid(id, unreadLinksMapRef.current);
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
        await fetchNotifications();
      } catch (err) {
        console.error('Failed to mark all notifications as read:', err);
        // Revert optimistic update on error
        setNotifications(previousNotifications);
        setUnreadCount(previousCount);
      }
    }

    // Notify other devices via WebSocket
    wsMarkAllAsRead();

    // Clear the unread links map — everything is read now
    unreadLinksMapRef.current.clear();
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
