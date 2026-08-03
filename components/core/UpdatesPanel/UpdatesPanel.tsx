'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { PushNotification } from '@/types/push-notifications.types';
import { AnimatePresence, motion } from 'framer-motion';
import { useNotificationAnalytics } from '@/analytics/notification.analytics';
import { CloseIcon, ArrowRightIcon } from './icons';
import { EmptyState } from './EmptyState';
import { NotLoggedInState } from './NotLoggedInState';
import { NotificationItem } from './NotificationItem';
import s from './UpdatesPanel.module.scss';

interface UpdatesPanelProps {
  open: boolean;
  notifications: PushNotification[];
  unreadCount?: number;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  /** Rejects on failure (provider rolls back first); the panel reports it. */
  onMarkAllAsRead?: () => Promise<void>;
  isLoggedIn?: boolean;
}

export function UpdatesPanel({
  open,
  notifications,
  unreadCount = 0,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  isLoggedIn = true,
}: UpdatesPanelProps) {
  const analytics = useNotificationAnalytics();

  // aria-live announcement — the only feedback this flow has (no toast/undo
  // by design), and on failure the only signal a person gets at all.
  const [statusMessage, setStatusMessage] = useState('');
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const handleNotificationClick = (notification: PushNotification) => {
    analytics.onUpdatesPanelNotificationClicked(notification);
    analytics.onNotificationActionLinkClicked(notification, 'updates_panel');
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    onClose();
  };

  const handleMarkAllClick = async () => {
    const count = unreadCount;
    // The clicked button unmounts the moment the count hits zero — park focus
    // on the close button first so it never drops to <body>. Panel stays open.
    closeButtonRef.current?.focus();
    analytics.onMarkAllUpdatesReadClicked('updates_panel', count);
    setStatusMessage('All notifications marked as read');
    try {
      await onMarkAllAsRead?.();
    } catch {
      analytics.onMarkAllUpdatesReadFailed('updates_panel', count);
      setStatusMessage('Could not mark notifications as read');
    }
  };

  const handleViewAllClick = () => {
    analytics.onViewAllUpdatesClicked();
    onClose();
  };

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
                {/* Hidden (not disabled) with nothing unread — same rule as
                    the pill above, and never shown to logged-out viewers. */}
                {isLoggedIn && unreadCount > 0 && onMarkAllAsRead && (
                  <button type="button" className={s.markAllButton} onClick={handleMarkAllClick}>
                    Mark all as read
                  </button>
                )}
              </div>
              <button ref={closeButtonRef} className={s.closeButton} onClick={onClose} aria-label="Close">
                <CloseIcon />
              </button>
            </div>
            <span role="status" className={s.srOnly}>
              {statusMessage}
            </span>

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
                    />
                  ))}
                </div>
              )}
            </div>

            {isLoggedIn && (
              <div className={s.footer}>
                <Link href="/recent-updates" className={s.viewAllLink} onClick={handleViewAllClick}>
                  View all recent updates
                  <ArrowRightIcon />
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default UpdatesPanel;
