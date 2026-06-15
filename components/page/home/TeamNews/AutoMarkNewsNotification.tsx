'use client';

import { useEffect, useRef } from 'react';

import { usePushNotificationsContext } from '@/providers/PushNotificationsProvider';

/**
 * Marks any unread NEW_FEATURE and TEAM_NEWS notifications as read on mount.
 * Both surface their content on /home (the feature banner and the
 * "News from the network" feed), so landing here counts as having seen them.
 * Only rendered on /home, so no URL comparison is needed.
 */
const AUTO_MARK_CATEGORIES = ['NEW_FEATURE', 'TEAM_NEWS'] as const;

export function AutoMarkNewsNotification() {
  const { notifications, markAsRead } = usePushNotificationsContext();
  // Track UIDs we've already attempted so an API failure revert doesn't re-trigger.
  const attemptedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const toMark = notifications.filter(
      (n) =>
        !n.isRead &&
        (AUTO_MARK_CATEGORIES as readonly string[]).includes(n.category) &&
        !attemptedRef.current.has(n.id),
    );
    if (toMark.length === 0) return;
    toMark.forEach((n) => {
      attemptedRef.current.add(n.id);
      markAsRead(n.id);
    });
  }, [notifications, markAsRead]);

  return null;
}
