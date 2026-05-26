'use client';

import { useEffect, useRef } from 'react';

import { usePushNotificationsContext } from '@/providers/PushNotificationsProvider';

/**
 * Marks any unread NEW_FEATURE notifications as read on mount.
 * Only rendered on /home, so no URL comparison is needed.
 */
export function AutoMarkNewsNotification() {
  const { notifications, markAsRead } = usePushNotificationsContext();
  // Track UIDs we've already attempted so an API failure revert doesn't re-trigger.
  const attemptedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const toMark = notifications.filter(
      (n) => !n.isRead && n.category === 'NEW_FEATURE' && !attemptedRef.current.has(n.id),
    );
    if (toMark.length === 0) return;
    toMark.forEach((n) => {
      attemptedRef.current.add(n.id);
      markAsRead(n.id);
    });
  }, [notifications, markAsRead]);

  return null;
}
