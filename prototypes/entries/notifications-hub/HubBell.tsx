'use client';

import React from 'react';

import { BellIcon } from './icons';

import s from './NotificationsHub.module.scss';

type Props = {
  unreadCount: number;
  open: boolean;
  onToggle: () => void;
  // Widened to match what useRef<HTMLButtonElement>(null) actually returns
  // under the @types/react the Vercel build resolves.
  buttonRef: React.RefObject<HTMLButtonElement | null>;
};

/**
 * The trigger.
 *
 * Production shakes the bell through a 10-keyframe rotation on every new
 * notification and springs the badge in, neither guarded by
 * `prefers-reduced-motion`. Both are dropped here: the badge count changing is
 * already the signal, and a shake that fires while you are reading is an
 * interruption, not feedback. `aria-expanded` ties the button to the panel.
 */
export function HubBell({ unreadCount, open, onToggle, buttonRef }: Props) {
  return (
    <button
      ref={buttonRef}
      type="button"
      className={s.bellButton}
      onClick={onToggle}
      aria-label={unreadCount > 0 ? `Updates, ${unreadCount} unread` : 'Updates'}
      aria-haspopup="dialog"
      aria-expanded={open}
    >
      <BellIcon width={40} height={40} />
      {unreadCount > 0 && (
        <span className={s.badge} aria-hidden="true">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
