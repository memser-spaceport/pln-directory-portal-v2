'use client';

import React from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { usePushNotificationsContext } from '@/providers/PushNotificationsProvider';
import { useInfiniteNotifications } from '@/services/push-notifications/hooks';
import { authStatus } from '@/components/core/login/utils/authStatus';
import { PushNotification } from '@/types/push-notifications.types';
import { EmptyState } from './EmptyState';
import { NotificationItem } from './NotificationItem';
import { LoadingIndicator } from './LoadingIndicator';
import { NotLoggedInState } from '@/components/core/UpdatesPanel/NotLoggedInState';
import s from './RecentUpdatesSection.module.scss';

export function RecentUpdatesSection() {
  const isLoggedIn = authStatus.isLoggedIn();
  const { markAsRead } = usePushNotificationsContext();
  const { notifications, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading } = useInfiniteNotifications({
    enabled: isLoggedIn,
  });

  const handleNotificationClick = (notification: PushNotification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  if (!isLoggedIn) {
    return (
      <section id="recent-updates" className={s.section}>
        <h2 className={s.title}>Recent Updates</h2>
        <div className={s.card}>
          <NotLoggedInState />
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section id="recent-updates" className={s.section}>
        <h2 className={s.title}>Recent Updates</h2>
        <div className={s.card}>
          <LoadingIndicator />
        </div>
      </section>
    );
  }

  return (
    <section id="recent-updates" className={s.section}>
      <h2 className={s.title}>Recent Updates</h2>
      <div className={s.card}>
        {notifications.length === 0 ? (
          <EmptyState />
        ) : (
          <InfiniteScroll
            scrollableTarget="body"
            loader={null}
            hasMore={hasNextPage}
            dataLength={notifications.length}
            next={fetchNextPage}
            style={{ overflow: 'unset' }}
          >
            <div className={s.notificationsList}>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onNotificationClick={handleNotificationClick}
                />
              ))}
            </div>
            {isFetchingNextPage && <LoadingIndicator />}
          </InfiniteScroll>
        )}
      </div>
    </section>
  );
}

export default RecentUpdatesSection;
