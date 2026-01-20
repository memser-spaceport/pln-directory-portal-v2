'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { PushNotification } from '@/types/push-notifications.types';
import { AnimatePresence, motion } from 'framer-motion';
import { useNotificationAnalytics } from '@/analytics/notification.analytics';
import { CloseIcon, ArrowRightIcon } from './icons';
import { EmptyState } from './EmptyState';
import { NotLoggedInState } from './NotLoggedInState';
import { NotificationItem } from './NotificationItem';
import { IrlGatheringModal } from './IrlGatheringModal';
import s from './UpdatesPanel.module.scss';

interface UpdatesPanelProps {
  open: boolean;
  notifications: PushNotification[];
  unreadCount?: number;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  isLoggedIn?: boolean;
}

export function UpdatesPanel({
  open,
  notifications,
  unreadCount = 0,
  onClose,
  onMarkAsRead,
  isLoggedIn = true,
}: UpdatesPanelProps) {
  const analytics = useNotificationAnalytics();

  // IRL Gathering Modal state
  const [irlGatheringModalOpen, setIrlGatheringModalOpen] = useState(false);
  const [selectedIrlGathering, setSelectedIrlGathering] = useState<PushNotification | null>(null);

  const handleNotificationClick = (notification: PushNotification) => {
    analytics.onUpdatesPanelNotificationClicked(notification);
    analytics.onNotificationActionLinkClicked(notification, 'updates_panel');
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    onClose();
  };

  const handleViewAllClick = () => {
    analytics.onViewAllUpdatesClicked();
    onClose();
  };

  const handleIrlGatheringClick = useCallback(
    (notification: PushNotification) => {
      if (!notification.isRead) {
        onMarkAsRead(notification.id);
      }
      setSelectedIrlGathering(notification);
      setIrlGatheringModalOpen(true);
    },
    [onMarkAsRead],
  );

  const handleIrlGatheringModalClose = useCallback(() => {
    setIrlGatheringModalOpen(false);
    setSelectedIrlGathering(null);
  }, []);

  const handleIrlGatheringGoingClick = useCallback(() => {
    handleIrlGatheringModalClose();
    onClose();
  }, [handleIrlGatheringModalClose, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className={s.overlay}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
          <motion.div
            className={s.panel}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            <div className={s.header}>
              <div className={s.titleRow}>
                <h2 className={s.title}>Updates</h2>
                {isLoggedIn && unreadCount > 0 && (
                  <div className={s.unreadBadge}>
                    <span className={s.unreadBadgeText}>Unread {unreadCount}</span>
                  </div>
                )}
              </div>
              <button className={s.closeButton} onClick={onClose} aria-label="Close">
                <CloseIcon />
              </button>
            </div>

            <div className={s.content}>
              {!isLoggedIn ? (
                <NotLoggedInState onClose={onClose} />
              ) : notifications.length === 0 ? (
                <EmptyState />
              ) : (
                <div className={s.notificationsList}>
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onNotificationClick={handleNotificationClick}
                      onIrlGatheringClick={handleIrlGatheringClick}
                    />
                  ))}
                </div>
              )}
            </div>

            {isLoggedIn && (
              <div className={s.footer}>
                <Link href="/home#recent-updates" className={s.viewAllLink} onClick={handleViewAllClick}>
                  View all recent updates
                  <ArrowRightIcon />
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}

      {/* IRL Gathering Modal */}
      {selectedIrlGathering && (
        <IrlGatheringModal
          isOpen={irlGatheringModalOpen}
          onClose={handleIrlGatheringModalClose}
          notification={selectedIrlGathering}
          onGoingClick={handleIrlGatheringGoingClick}
        />
      )}
    </AnimatePresence>
  );
}

export default UpdatesPanel;
