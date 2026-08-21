'use client';

import { useContext, useEffect, useRef } from 'react';

import { PushNotificationsContext } from '@/providers/PushNotificationsProvider/PushNotificationsContext';

import { isTeamNewsItemNotification } from './utils/isTeamNewsItemNotification';

/**
 * Marks unread TEAM_NEWS comment notifications (mention/reply) as read when the
 * matching news detail modal is open. Does nothing on bare /home — those
 * notifications keep `?news=` so pathname auto-mark will not clear them.
 */
export function AutoMarkNewsCommentNotification({ newsItemUid }: { newsItemUid: string | null }) {
  const context = useContext(PushNotificationsContext);
  const notifications = context?.notifications;
  const markAsRead = context?.markAsRead;
  const attemptedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!newsItemUid || !notifications || !markAsRead) return;

    const toMark = notifications.filter(
      (n) => !n.isRead && !attemptedRef.current.has(n.id) && isTeamNewsItemNotification(n, newsItemUid),
    );
    if (toMark.length === 0) return;

    toMark.forEach((n) => {
      attemptedRef.current.add(n.id);
      markAsRead(n.id);
    });
  }, [newsItemUid, notifications, markAsRead]);

  return null;
}
