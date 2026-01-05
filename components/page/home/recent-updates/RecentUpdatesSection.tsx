'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { stripHtml, usePushNotificationsContext } from '@/providers/PushNotificationsProvider';
import { useInfiniteNotifications } from '@/services/push-notifications/hooks';
import { useNotificationAnalytics } from '@/analytics/notification.analytics';
import { authStatus } from '@/components/core/login/utils/authStatus';
import { PushNotification } from '@/types/push-notifications.types';
import { EmptyState } from './EmptyState';
import { NotificationItem } from '@/components/core/UpdatesPanel/NotificationItem';
import { LoadingIndicator } from './LoadingIndicator';
import { NotLoggedInState } from '@/components/core/UpdatesPanel/NotLoggedInState';
import { IrlGatheringModal } from '@/components/core/UpdatesPanel/IrlGatheringModal';
import s from './RecentUpdatesSection.module.scss';

// ============================================================================
// TODO: REMOVE THIS MOCK NOTIFICATION - For testing IRL_GATHERING modal UI
// ============================================================================
const MOCK_IRL_GATHERING_NOTIFICATION: PushNotification = {
  id: 'mock-irl-gathering-001',
  category: 'IRL_GATHERING',
  title: 'IRL Gatherings: Denver',
  description: '16 IRL events happening in Denver between Feb 16 – Feb 28, 2026.',
  link: '/irl',
  isPublic: true,
  isRead: false,
  createdAt: new Date().toISOString(),
  metadata: {
    gatheringName: 'IRL Gatherings: Denver',
    aboutDescription:
      '16 IRL events happening in Denver between Feb 16 – Feb 28, 2026.\nSome of the major events include ETHDenver, FIL Dev Summit, and other community-led meetups across Web3, AI, and decentralized infrastructure.',
    dateRange: 'Feb 16, 2026 – Feb 28, 2026',
    location: 'Denver, CO',
    telegramLink: 'https://t.me/example',
    eventsCount: 16,
    eventsLink: '/irl/denver/events',
    speakerIntakeLink: 'https://example.com/speaker-intake',
    submittedEventsCount: 5,
    submitEventLink: '/irl/denver/submit',
    otherResourcesLink: 'https://example.com/resources',
    attendees: [
      { uid: 'user-1', picture: 'https://i.pravatar.cc/150?u=user1' },
      { uid: 'user-2', picture: 'https://i.pravatar.cc/150?u=user2' },
      { uid: 'user-3', picture: 'https://i.pravatar.cc/150?u=user3' },
    ],
    attendeesCount: 37,
    planningQuestion: 'Are you planning to be in Denver?',
  },
};
// ============================================================================

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

  // IRL Gathering Modal state
  const [irlGatheringModalOpen, setIrlGatheringModalOpen] = useState(false);
  const [selectedIrlGathering, setSelectedIrlGathering] = useState<PushNotification | null>(null);

  // Sanitize notifications to remove HTML markup from title and description
  // TODO: REMOVE MOCK_IRL_GATHERING_NOTIFICATION from the array below when done testing
  const sanitizedNotifications = useMemo(
    () => [MOCK_IRL_GATHERING_NOTIFICATION, ...notifications.map(sanitizeNotification)],
    [notifications]
  );

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

  const handleIrlGatheringClick = useCallback((notification: PushNotification) => {
    setSelectedIrlGathering(notification);
    setIrlGatheringModalOpen(true);
  }, []);

  const handleIrlGatheringModalClose = useCallback(() => {
    setIrlGatheringModalOpen(false);
    setSelectedIrlGathering(null);
  }, []);

  const handleIrlGatheringGoingClick = useCallback(() => {
    // TODO: Implement "I'm Going" functionality
    console.log('User clicked "I\'m Going" for:', selectedIrlGathering?.id);
    handleIrlGatheringModalClose();
  }, [selectedIrlGathering, handleIrlGatheringModalClose]);

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
    <>
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
                    onIrlGatheringClick={handleIrlGatheringClick}
                    variant="page"
                  />
                ))}
              </div>
              {isFetchingNextPage && <LoadingIndicator />}
            </InfiniteScroll>
          )}
        </div>
      </section>

      {/* IRL Gathering Modal */}
      {selectedIrlGathering && (
        <IrlGatheringModal
          isOpen={irlGatheringModalOpen}
          onClose={handleIrlGatheringModalClose}
          notification={selectedIrlGathering}
          onGoingClick={handleIrlGatheringGoingClick}
        />
      )}
    </>
  );
}

export default RecentUpdatesSection;
