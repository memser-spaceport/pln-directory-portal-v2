'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import { MOCK_NOTIFICATIONS, type HubNotification } from './mocks';
import { showUndoToast } from './showUndoToast';

/**
 * All notification state for the hub, shared by the bell-panel entry and the
 * full-page inbox entry so the two surfaces behave identically.
 *
 * Every state change a user could trigger by accident — a row read toggle, a
 * bulk mark-all — snapshots the list first and surfaces a toast with Undo. A
 * confirm dialog on each would be intolerable at this frequency; an undo costs
 * nothing until it is needed.
 *
 * Nothing here deletes. Dismiss was removed deliberately: a notification is a
 * record of something that happened, not a task to clear, so read/unread is
 * the whole state space — and it is reversible in both directions.
 *
 * Mocked throughout — no service, no WebSocket provider, no react-query.
 */
export function useHubNotifications() {
  const [notifications, setNotifications] = useState<HubNotification[]>(MOCK_NOTIFICATIONS);

  // The pre-action list, held in a ref rather than state: nothing renders from
  // it, and the toast that reads it lives outside React's tree.
  const undoableRef = useRef<HubNotification[] | null>(null);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  /**
   * Snapshot the current list, apply the change, then announce it through
   * production's toast with an Undo. The toast owns its own dismissal timer,
   * so there is no bespoke countdown here.
   */
  const commit = useCallback(
    (label: string, next: (prev: HubNotification[]) => HubNotification[]) => {
      undoableRef.current = notifications;
      setNotifications(next);

      showUndoToast(label, () => {
        const previous = undoableRef.current;
        if (previous) setNotifications(previous);
        undoableRef.current = null;
      });
    },
    [notifications],
  );

  const toggleRead = useCallback(
    (id: string) => {
      const target = notifications.find((n) => n.id === id);
      if (!target) return;

      // Announces the resulting state, not the button that was pressed — after
      // an accidental tap you need to know where you ended up.
      const label = target.isRead ? 'Marked as unread' : 'Marked as read';
      commit(label, (prev) => prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n)));
    },
    [notifications, commit],
  );

  /**
   * Opening a notification marks it read. No toast — the user asked for this
   * one by clicking through to it, so it is not a mis-tap risk.
   */
  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    const count = notifications.filter((n) => !n.isRead).length;
    if (count === 0) return;

    commit(`${count} ${count === 1 ? 'update' : 'updates'} marked as read`, (prev) =>
      prev.map((n) => ({ ...n, isRead: true })),
    );
  }, [notifications, commit]);

  /** Announce something that isn't reversible — same toast, no Undo button. */
  const showToast = useCallback((label: string) => {
    undoableRef.current = null;
    showUndoToast(label);
  }, []);

  const reset = useCallback(() => {
    setNotifications(MOCK_NOTIFICATIONS);
    undoableRef.current = null;
  }, []);

  return {
    notifications,
    unreadCount,
    toggleRead,
    markRead,
    markAllRead,
    showToast,
    reset,
  };
}
