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
import { ViewSwitch, applyView, type UpdatesView } from './ViewSwitch/ViewSwitch';
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

  // All / Unread / Read scoping (prototype behavior). Deliberately NOT reset
  // on close: reopening where you left off matches the proto's session-scoped
  // view state.
  const [view, setView] = useState<UpdatesView>('all');
  const visibleNotifications = applyView(notifications, view);

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
    // The clicked button disables the moment the count hits zero, which drops
    // its focus — park it on the close button first so it never lands on
    // <body>. Panel stays open.
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
              </div>
              <button ref={closeButtonRef} className={s.closeButton} onClick={onClose} aria-label="Close">
                <CloseIcon />
              </button>
            </div>

            {/* The prototype's filter row: All/Unread/Read scoping against the
                list it scopes, beside the bulk action that operates on the same
                set. Mark-all stays visible-but-disabled at zero unread (with a
                Read segment present, a bulk mark-as-read hides nothing).
                Logged-out viewers never see this row. */}
            {isLoggedIn && (
              <div className={s.actionRow}>
                <ViewSwitch view={view} unreadCount={unreadCount} onChange={setView} />
                {onMarkAllAsRead && (
                  <button
                    type="button"
                    className={s.markAllButton}
                    onClick={handleMarkAllClick}
                    disabled={unreadCount === 0}
                  >
                    Mark all as read
                  </button>
                )}
              </div>
            )}
            <span role="status" className={s.srOnly}>
              {statusMessage}
            </span>

            <div className={s.content}>
              {!isLoggedIn ? (
                <NotLoggedInState onClose={onClose} />
              ) : notifications.length === 0 ? (
                <EmptyState />
              ) : visibleNotifications.length === 0 ? (
                // The list has items — just none in this segment. The proto's
                // per-view copy, with an escape back to All where one helps.
                <div className={s.viewEmptyState}>
                  {view === 'unread' ? (
                    <>
                      <svg
                        width="56"
                        height="56"
                        viewBox="0 0 56 56"
                        fill="none"
                        aria-hidden="true"
                        className="NotificationsHub-module-scss-module__GrkIOW__emptyIcon"
                      >
                        <path
                          d="M8 30.5 13.2 14a3 3 0 0 1 2.85-2.05h23.9A3 3 0 0 1 42.8 14L48 30.5m-40 0V40a4 4 0 0 0 4 4h32a4 4 0 0 0 4-4v-9.5m-40 0h10.8a2 2 0 0 1 1.86 1.27l.62 1.56A2 2 0 0 0 23.14 35h9.72a2 2 0 0 0 1.86-1.27l.62-1.56A2 2 0 0 1 37.2 30.5H48"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ></path>
                      </svg>
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
                <div className={s.notificationsList}>
                  {visibleNotifications.map((notification) => (
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
