'use client';

import React, { useMemo, useRef, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { stripHtml, usePushNotificationsContext } from '@/providers/PushNotificationsProvider';
import { useInfiniteNotifications } from '@/services/push-notifications/hooks';
import { useNotificationAnalytics } from '@/analytics/notification.analytics';
import { PushNotification } from '@/types/push-notifications.types';
import { EmptyState } from './components/EmptyState/EmptyState';
import { NotificationItem } from '@/components/core/UpdatesPanel/NotificationItem';
import { LoadingIndicator } from './components/LoadingIndicator/LoadingIndicator';
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

interface Props {
  isLoggedIn: boolean;
}

export function RecentUpdatesSection(props: Props) {
  const { isLoggedIn } = props;

  // unreadCount from the provider, NOT from the infinite query: pages[0]'s
  // count is a snapshot from the first fetch, while the provider's is live —
  // it zeroes the moment mark-all runs (from either surface, or another tab).
  const { markAsRead, markAllAsRead, unreadCount } = usePushNotificationsContext();
  const analytics = useNotificationAnalytics();
  const { notifications, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading } = useInfiniteNotifications({
    enabled: isLoggedIn,
  });

  // aria-live announcement — this flow's only feedback (no toast/undo by design).
  const [statusMessage, setStatusMessage] = useState('');
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Sanitize notifications to remove HTML markup from title and description
  // TODO: REMOVE MOCK_IRL_GATHERING_NOTIFICATION from the array below when done testing
  const sanitizedNotifications = useMemo(() => notifications.map(sanitizeNotification), [notifications]);

  const handleNotificationClick = (notification: PushNotification) => {
    analytics.onRecentUpdatesNotificationClicked(notification);
    analytics.onNotificationActionLinkClicked(notification, 'recent_updates');
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  const handleMarkAllClick = async () => {
    const count = unreadCount;
    // The clicked button unmounts when the count hits zero — park focus on the
    // heading first so it never drops to <body>.
    titleRef.current?.focus();
    analytics.onMarkAllUpdatesReadClicked('recent_updates', count);
    setStatusMessage('All notifications marked as read');
    try {
      await markAllAsRead();
    } catch {
      analytics.onMarkAllUpdatesReadFailed('recent_updates', count);
      setStatusMessage('Could not mark notifications as read');
    }
  };

  const renderHeader = () => (
    <div className={s.header}>
      <h2 className={s.title} tabIndex={-1} ref={titleRef}>
        Recent Updates
      </h2>
      {isLoggedIn && unreadCount > 0 && (
        <>
          <div className={s.unreadBadge}>
            <span className={s.unreadBadgeText}>Unread {unreadCount}</span>
          </div>
          {/* Hidden (not disabled) with nothing unread — same rule as the pill. */}
          <button type="button" className={s.markAllButton} onClick={handleMarkAllClick}>
            Mark all as read
          </button>
        </>
      )}
      <span role="status" className={s.srOnly}>
        {statusMessage}
      </span>
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
                  variant="page"
                  backTo="/recent-updates"
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
