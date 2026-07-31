'use client';

import React from 'react';

import s from './NotificationsHub.module.scss';

export type HubView = 'all' | 'unread' | 'read';

type Props = {
  view: HubView;
  unreadCount: number;
  onChange: (next: HubView) => void;
};

const OPTIONS: Array<{ value: HubView; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
];

/**
 * All / Unread / Read, modelled on the Airtable panel's Unread|Read switch.
 *
 * Two reasons this beats the single "unread only" toggle it replaces:
 * read notifications become reachable at all (previously they were only
 * findable by scrolling the merged list), and a bulk mark-as-read stops being
 * destructive-feeling, because everything it touched is one segment away.
 *
 * The extra "All" segment is a deliberate departure from the reference: with
 * eight source domains feeding this hub, the merged chronological view is the
 * useful default.
 */
export function ViewSwitch({ view, unreadCount, onChange }: Props) {
  return (
    <div className={s.segmented} role="tablist" aria-label="Filter updates">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={view === opt.value}
          className={s.segmentedBtn}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
          {opt.value === 'unread' && unreadCount > 0 && (
            <span className={s.segmentCount}>{unreadCount}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/** Shared filter, so the panel and the full page never diverge. */
export function applyView<T extends { isRead: boolean }>(items: T[], view: HubView): T[] {
  if (view === 'unread') return items.filter((n) => !n.isRead);
  if (view === 'read') return items.filter((n) => n.isRead);
  return items;
}
