'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { PushNotification } from '@/types/push-notifications.types';
import { AnimatePresence, motion } from 'framer-motion';
import { useNotificationAnalytics } from '@/analytics/notification.analytics';
import { CloseIcon, ArrowRightIcon } from './icons';
import { EmptyState } from './EmptyState';
import { NotLoggedInState } from './NotLoggedInState';
import { NotificationItem } from './NotificationItem';
import { ViewSwitch, applyView, type UpdatesView } from './ViewSwitch/ViewSwitch';
import { HeaderSearch, matchesQuery } from './HeaderSearch/HeaderSearch';
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
  const panelRef = useRef<HTMLDivElement>(null);

  // All / Unread / Read scoping. Re-defaults each time the panel opens:
  // Unread when there are any, otherwise All — so an empty Unread tab is
  // never the first thing you see.
  const [view, setView] = useState<UpdatesView>('all');

  useEffect(() => {
    if (!open) return;
    setView(unreadCount > 0 ? 'unread' : 'all');
    // Re-default only when the panel opens — while open, the user's tab
    // choice sticks even as mark-as-read changes the count.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Search state. Deliberately NOT reset on close: reopening where you left
  // off matches the proto's session-scoped search.
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchFieldRef = useRef<HTMLDivElement>(null);
  const searchToggleRef = useRef<HTMLButtonElement>(null);
  // Set on mousedown inside the list, cleared next tick — long enough to
  // survive the blur that fires between mousedown and click on a
  // notification, so an in-flight list click never gets collapsed out from
  // under itself.
  const listMouseDownRef = useRef(false);

  const visibleNotifications = useMemo(
    () => applyView(notifications, view).filter((n) => matchesQuery(n, query)),
    [notifications, view, query],
  );
  const isSearching = query.trim().length > 0;

  useEffect(() => {
    if (searchOpen) searchFieldRef.current?.querySelector('input')?.focus();
  }, [searchOpen]);

  // Fires once per settled (already-debounced by SearchInput) query change —
  // no separate debounce needed for the analytics call.
  useEffect(() => {
    if (!isSearching) return;
    analytics.onUpdatesSearchQueried(query, visibleNotifications.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleSearchOpen = useCallback(() => {
    setSearchOpen(true);
    analytics.onUpdatesSearchOpened();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stable identity is required here: SearchInput's DebouncedInput memoizes
  // its debounce timer on this callback's identity (see DebouncedInput.tsx),
  // so a fresh function each render would silently reset in-flight typing.
  const handleSearchChange = useCallback((value: string) => setQuery(value), []);

  const handleSearchBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    const related = e.relatedTarget as Node | null;
    const staysInsidePanel = !!related && !!panelRef.current?.contains(related);
    const liveValue = searchFieldRef.current?.querySelector('input')?.value ?? '';
    if (liveValue || staysInsidePanel || listMouseDownRef.current) return;
    setSearchOpen(false);
  }, []);

  // DebouncedInput's own onKeyUp (on the nested <input>) runs first and
  // clears the field synchronously on Escape, but React doesn't commit that
  // state to the DOM until after this bubbled handler also finishes — so
  // reading the live input value here still sees the pre-clear text on the
  // first Escape (skip collapsing, let the clear stand alone) and only sees
  // empty on a second, separate Escape press (collapse + return focus to the
  // toggle button, per standard expand/collapse keyboard convention).
  const handleSearchKeyUp = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Escape') return;
    const liveValue = searchFieldRef.current?.querySelector('input')?.value ?? '';
    if (liveValue) return;
    setSearchOpen(false);
    searchToggleRef.current?.focus();
  }, []);

  const handleListMouseDown = useCallback(() => {
    listMouseDownRef.current = true;
    setTimeout(() => {
      listMouseDownRef.current = false;
    }, 0);
  }, []);

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
            ref={panelRef}
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
                {isLoggedIn && (
                  <HeaderSearch
                    open={searchOpen}
                    value={query}
                    onOpen={handleSearchOpen}
                    onChange={handleSearchChange}
                    onBlur={handleSearchBlur}
                    onKeyUp={handleSearchKeyUp}
                    fieldRef={searchFieldRef}
                    toggleRef={searchToggleRef}
                  />
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
              ) : isSearching && visibleNotifications.length === 0 ? (
                // Distinct from the tab-empty state below: the list (and this
                // tab) has items, search just didn't match any of them.
                <div className={s.viewEmptyState}>
                  <p className={s.viewEmptyTitle}>No results for &lsquo;{query}&rsquo;</p>
                  <p className={s.viewEmptyBody}>Try a different keyword.</p>
                </div>
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
                <div className={s.notificationsList} onMouseDown={handleListMouseDown}>
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
