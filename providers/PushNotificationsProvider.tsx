'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import {
  PushNotification,
  NotificationUpdatePayload,
  NotificationCountPayload,
} from '@/types/push-notifications.types';
import {
  getNotifications,
  getUnreadLinks,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/services/push-notifications.service';
import { processPostContent } from '@/components/page/forum/Post';

/**
 * Strips HTML markup from a string, returning plain text
 */
export function stripHtml(html: string | undefined | null): string {
  if (!html) return '';

  const { processedContent } = processPostContent(html);

  const div = document.createElement('div');
  div.innerHTML = processedContent;
  return div.textContent || div.innerText || '';
}

/**
 * Sanitizes notification title and description by removing HTML markup
 */
function sanitizeNotification<T extends { title?: string; description?: string }>(notification: T): T {
  return {
    ...notification,
    title: stripHtml(notification.title),
    description: stripHtml(notification.description),
  };
}

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

// Paths that can match notification links
const NOTIFICATION_LINK_PATTERNS = ['/forum/topics/', '/demoday/', '/events/irl/'];

function pathMatchesNotificationPattern(path: string): boolean {
  return NOTIFICATION_LINK_PATTERNS.some((pattern) => path.startsWith(pattern));
}

export function PushNotificationsProvider({ children, authToken, enabled = true }: PushNotificationsProviderProps) {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const lastAutoMarkedLinkRef = useRef<string | null>(null);
  const unreadLinksRef = useRef<Map<string, string[]>>(new Map());
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  // Build a Map<link, uid[]> from unread links array
  function buildUnreadLinksMap(links: Array<{ uid: string; link: string }>): Map<string, string[]> {
    const map = new Map<string, string[]>();
    for (const { uid, link } of links) {
      const existing = map.get(link);
      if (existing) {
        existing.push(uid);
      } else {
        map.set(link, [uid]);
      }
    }
    return map;
  }

  // Remove uid from the unread links map
  function removeUidFromUnreadLinks(map: Map<string, string[]>, uid: string) {
    for (const [link, uids] of map) {
      const idx = uids.indexOf(uid);
      if (idx !== -1) {
        uids.splice(idx, 1);
        if (uids.length === 0) {
          map.delete(link);
        }
        break;
      }
    }
  }

  // Fetch unread links and build the lookup map
  const fetchUnreadLinks = useCallback(async () => {
    if (!authToken) return;
    try {
      const links = await getUnreadLinks(authToken);
      unreadLinksRef.current = buildUnreadLinksMap(links);
    } catch (err) {
      console.error('Failed to fetch unread links:', err);
    }
  }, [authToken]);

  // Fetch initial notifications on mount
  const fetchNotifications = useCallback(async () => {
    if (!authToken) return;

    setIsLoading(true);
    try {
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
      fetchUnreadLinks();
    }
  }, [enabled, authToken, fetchNotifications, fetchUnreadLinks]);

  // Handle new notification from WebSocket
  const handleNewNotification = useCallback((notification: PushNotification) => {
    const sanitized = sanitizeNotification(notification);
    let isDuplicate = false;
    setNotifications((prev) => {
      // Avoid duplicates
      const notificationId = sanitized.id;
      if (prev.some((n) => n.id === notificationId)) {
        isDuplicate = true;
        return prev;
      }
      return [{ ...sanitized, isRead: false }, ...prev];
    });
    if (isDuplicate) return;

    setUnreadCount((prev) => prev + 1);

    // Add to unread links map
    const uid = sanitized.id;
    const link = sanitized.link;
    if (uid && link) {
      const map = unreadLinksRef.current;
      const existing = map.get(link);
      if (existing) {
        existing.push(uid);
      } else {
        map.set(link, [uid]);
      }

      // If the user is currently on the matching page, auto-mark immediately
      if (pathnameRef.current === link && authToken) {
        removeUidFromUnreadLinks(map, uid);
        markNotificationAsRead(authToken, uid).catch((err) => {
          console.error('Failed to auto-mark new notification on current page:', err);
          // Re-add to map on error
          const uids = map.get(link);
          if (uids) {
            uids.push(uid);
          } else {
            map.set(link, [uid]);
          }
        });
      }
    }
  }, [authToken]);

  // Handle notification update from WebSocket (sync across devices)
  const handleNotificationUpdate = useCallback((payload: NotificationUpdatePayload) => {
    if (payload.status === 'deleted') {
      let wasUnread = false;
      setNotifications((prev) => {
        const notification = prev.find((n) => n.id === payload.id);
        wasUnread = !!notification && !notification.isRead;
        return prev.filter((n) => n.id !== payload.id);
      });
      if (wasUnread) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      removeUidFromUnreadLinks(unreadLinksRef.current, payload.id);
    } else if (payload.status === 'read') {
      let wasUnread = false;
      setNotifications((prev) => {
        const notification = prev.find((n) => n.id === payload.id);
        wasUnread = !!notification && !notification.isRead;
        return prev.map((n) => (n.id === payload.id ? { ...n, isRead: true } : n));
      });
      if (wasUnread) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      removeUidFromUnreadLinks(unreadLinksRef.current, payload.id);
    }
  }, []);

  // Handle count update from WebSocket
  const handleCountUpdate = useCallback((payload: NotificationCountPayload) => {
    setUnreadCount(payload.unreadCount);
    if (payload.unreadCount === 0) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      unreadLinksRef.current = new Map();
    }
  }, []);

  const { isConnected, error } = usePushNotifications({
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
      void fetchUnreadLinks();
    }
  }, [isConnected, authToken, fetchNotifications, fetchUnreadLinks]);

  // Auto-mark notifications as read when navigating to a page matching a notification link.
  useEffect(() => {
    if (!authToken || !pathname || !enabled) return;
    if (!pathMatchesNotificationPattern(pathname)) return;
    if (lastAutoMarkedLinkRef.current === pathname) return;

    const timer = setTimeout(async () => {
      const matchingUids = unreadLinksRef.current.get(pathname);
      if (!matchingUids || matchingUids.length === 0) return;

      lastAutoMarkedLinkRef.current = pathname;

      // Optimistic: remove from map immediately
      const uidsToMark = [...matchingUids];
      unreadLinksRef.current.delete(pathname);

      try {
        await Promise.all(uidsToMark.map((uid) => markNotificationAsRead(authToken, uid)));
      } catch (err) {
        console.error('Failed to auto-mark notifications by link:', err);
        // Re-add to map on error for retry
        unreadLinksRef.current.set(pathname, uidsToMark);
        lastAutoMarkedLinkRef.current = null;
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [pathname, authToken, enabled]);

  // Mark single notification as read
  const markAsRead = useCallback(
    async (id: string) => {
      const notification = notifications.find((n) => n.id === id);
      if (!notification || notification.isRead) return;

      // Call REST API
      if (authToken) {
        try {
          await markNotificationAsRead(authToken, id);
        } catch (err) {
          console.error('Failed to mark notification as read:', err);
        }
      }
    },
    [notifications, authToken],
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
  }, [notifications, unreadCount, authToken]);

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
