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
import { ViewSwitch, applyView, type UpdatesView } from '@/components/core/UpdatesPanel/ViewSwitch/ViewSwitch';
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

  // All / Unread / Read scoping (the inbox prototype's arrangement). Filters
  // the pages loaded so far; scrolling keeps feeding the filter.
  const [view, setView] = useState<UpdatesView>('all');

  // Sanitize notifications to remove HTML markup from title and description
  // TODO: REMOVE MOCK_IRL_GATHERING_NOTIFICATION from the array below when done testing
  const sanitizedNotifications = useMemo(() => notifications.map(sanitizeNotification), [notifications]);
  const visibleNotifications = applyView(sanitizedNotifications, view);

  const handleNotificationClick = (notification: PushNotification) => {
    analytics.onRecentUpdatesNotificationClicked(notification);
    analytics.onNotificationActionLinkClicked(notification, 'recent_updates');
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  const handleMarkAllClick = async () => {
    const count = unreadCount;
    // The clicked button disables when the count hits zero, which drops its
    // focus — park it on the heading first so it never lands on <body>.
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
        <div className={s.unreadBadge}>
          <span className={s.unreadBadgeText}>Unread {unreadCount}</span>
        </div>
      )}
      <span role="status" className={s.srOnly}>
        {statusMessage}
      </span>
    </div>
  );

  // The inbox prototype's filter row, between the header and the card: view
  // scoping sits against the list it scopes, beside the bulk action that
  // operates on the same set. Mark-all is grayed out (not hidden) at zero
  // unread. Logged-out viewers never see this row.
  const renderFilters = () =>
    isLoggedIn && (
      <div className={s.filtersRow}>
        <ViewSwitch view={view} unreadCount={unreadCount} onChange={setView} />
        <button type="button" className={s.markAllButton} onClick={handleMarkAllClick} disabled={unreadCount === 0}>
          Mark all as read
        </button>
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
      {renderFilters()}
      <div className={s.card}>
        {sanitizedNotifications.length === 0 ? (
          <EmptyState />
        ) : visibleNotifications.length === 0 ? (
          // The list has items — just none in this segment (proto copy).
          <div className={s.viewEmptyState}>
            {view === 'unread' ? (
              <>
                <p className={s.viewEmptyTitle}>You&apos;re all caught up</p>
                <p className={s.viewEmptyBody}>Nothing unread right now.</p>
                <button type="button" className={s.viewEmptyAction} onClick={() => setView('all')}>
                  Show all updates
                </button>
              </>
            ) : (
              <>
                <p className={s.viewEmptyTitle}>Nothing read yet</p>
                <p className={s.viewEmptyBody}>Updates you&apos;ve read will collect here.</p>
              </>
            )}
          </div>
        ) : (
          <InfiniteScroll
            scrollableTarget="body"
            loader={null}
            hasMore={hasNextPage}
            dataLength={visibleNotifications.length}
            next={fetchNextPage}
            style={{ overflow: 'unset' }}
          >
            <div className={s.notificationsList}>
              {visibleNotifications.map((notification) => (
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
