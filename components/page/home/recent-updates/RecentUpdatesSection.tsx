'use client';

import React, { useEffect, useMemo } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { stripHtml, usePushNotificationsContext } from '@/providers/PushNotificationsProvider';
import { useInfiniteNotifications } from '@/services/push-notifications/hooks';
import { useNotificationAnalytics } from '@/analytics/notification.analytics';
import { authStatus } from '@/components/core/login/utils/authStatus';
import { PushNotification } from '@/types/push-notifications.types';
import { EmptyState } from './EmptyState';
import { NotificationItem } from './NotificationItem';
import { LoadingIndicator } from './LoadingIndicator';
import { NotLoggedInState } from '@/components/core/UpdatesPanel/NotLoggedInState';
import s from './RecentUpdatesSection.module.scss';

/**
 * Sanitizes notification title and description by removing HTML markup
 */
function sanitizeNotification(notification: PushNotification): PushNotification {
  return {
    ...notification,
    title: stripHtml(notification.title),
    description: stripHtml(notification.description),
  };
}

export function RecentUpdatesSection() {
  const isLoggedIn = authStatus.isLoggedIn();
  const { markAsRead, unreadCount: globalUnreadCount } = usePushNotificationsContext();
  const analytics = useNotificationAnalytics();
  const { notifications, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading, unreadCount, refetch } =
    useInfiniteNotifications({
      enabled: isLoggedIn,
    });

  // Sanitize notifications to remove HTML markup from title and description
  const sanitizedNotifications = useMemo(() => notifications.map(sanitizeNotification), [notifications]);

  useEffect(() => {
    if (globalUnreadCount !== unreadCount) {
      void refetch();
    }
  }, [globalUnreadCount, unreadCount, refetch]);

  const handleNotificationClick = (notification: PushNotification) => {
    analytics.onRecentUpdatesNotificationClicked(notification);
    analytics.onNotificationActionLinkClicked(notification, 'recent_updates');
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  const renderHeader = () => (
    <div className={s.header}>
      <h2 className={s.title}>Recent Updates</h2>
      {isLoggedIn && unreadCount > 0 && (
        <div className={s.unreadBadge}>
          <span className={s.unreadBadgeText}>Unread {unreadCount}</span>
        </div>
      )}
    </div>
  );

  if (!isLoggedIn) {
    return (
      <section id="recent-updates" className={s.section}>
        {renderHeader()}
        <div className={s.card}>
          <NotLoggedInState />
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section id="recent-updates" className={s.section}>
        {renderHeader()}
        <div className={s.card}>
          <LoadingIndicator />
        </div>
      </section>
    );
  }

  return (
    <section id="recent-updates" className={s.section}>
      {renderHeader()}
      <div className={s.card}>
        {sanitizedNotifications.length === 0 ? (
          <EmptyState />
        ) : (
          <InfiniteScroll
            scrollableTarget="body"
            loader={null}
            hasMore={hasNextPage}
            dataLength={sanitizedNotifications.length}
            next={fetchNextPage}
            style={{ overflow: 'unset' }}
          >
            <div className={s.notificationsList}>
              {sanitizedNotifications.map((notification) => (
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
