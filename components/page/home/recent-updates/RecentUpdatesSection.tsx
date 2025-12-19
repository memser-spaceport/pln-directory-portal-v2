'use client';

import React from 'react';
import { usePushNotificationsContext } from '@/providers/PushNotificationsProvider';
import { PushNotification } from '@/types/push-notifications.types';
import { EmptyState } from './EmptyState';
import { NotificationItem } from './NotificationItem';
import s from './RecentUpdatesSection.module.scss';

export function RecentUpdatesSection() {
  const { notifications, markAsRead } = usePushNotificationsContext();

  const handleNotificationClick = (notification: PushNotification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  return (
    <section id="recent-updates" className={s.section}>
      <h2 className={s.title}>Recent Updates</h2>
      <div className={s.card}>
        {notifications.length === 0 ? (
          <EmptyState />
        ) : (
          <div className={s.notificationsList}>
            {notifications.slice(0, 8).map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onNotificationClick={handleNotificationClick}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default RecentUpdatesSection;

