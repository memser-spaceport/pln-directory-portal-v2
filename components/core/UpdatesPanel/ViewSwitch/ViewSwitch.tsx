'use client';

import React from 'react';

import s from './ViewSwitch.module.scss';

export type UpdatesView = 'all' | 'unread' | 'read';

type Props = {
  view: UpdatesView;
  unreadCount: number;
  onChange: (next: UpdatesView) => void;
};

const OPTIONS: Array<{ value: UpdatesView; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
];

/**
 * All / Unread / Read, transcribed from the notifications-hub prototype's
 * ViewSwitch. Read notifications become reachable without scrolling the
 * merged list, and a bulk mark-as-read stops feeling destructive — everything
 * it touched is one segment away.
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
          {opt.value === 'unread' && unreadCount > 0 && <span className={s.segmentCount}>{unreadCount}</span>}
        </button>
      ))}
    </div>
  );
}

/** Shared filter, so the panel and the full page never diverge. An absent
 *  isRead counts as unread — the same reading the unread dot gives it. */
export function applyView<T extends { isRead?: boolean }>(items: T[], view: UpdatesView): T[] {
  if (view === 'unread') return items.filter((n) => !n.isRead);
  if (view === 'read') return items.filter((n) => n.isRead);
  return items;
}
