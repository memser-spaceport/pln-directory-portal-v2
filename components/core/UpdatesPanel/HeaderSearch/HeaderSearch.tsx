'use client';

import type { FocusEvent, KeyboardEvent, RefObject } from 'react';
import { clsx } from 'clsx';

import { SearchIcon } from '@/components/icons';
import { SearchInput } from '@/components/common/filters/SearchInput';
import { PushNotification } from '@/types/push-notifications.types';

import { getCategoryLabel } from '../NotificationItem/utils/getCategoryLabel';

import s from './HeaderSearch.module.scss';

interface Props {
  open: boolean;
  value: string;
  onOpen: () => void;
  onChange: (value: string) => void;
  onBlur: (e: FocusEvent<HTMLDivElement>) => void;
  onKeyUp: (e: KeyboardEvent<HTMLDivElement>) => void;
  fieldRef: RefObject<HTMLDivElement | null>;
  toggleRef: RefObject<HTMLButtonElement | null>;
}

/**
 * Ported from prototypes/entries/newsfeed-v0/HeaderSearch.tsx. Unlike the
 * prototype, the toggle button stays mounted (just hidden) while the field is
 * open, so aria-expanded reflects real state on one persistent element and
 * Escape/blur can reliably return focus to it — the prototype's hard
 * button/field swap loses the button node while expanded.
 */
export function HeaderSearch({ open, value, onOpen, onChange, onBlur, onKeyUp, fieldRef, toggleRef }: Props) {
  return (
    <>
      <button
        type="button"
        ref={toggleRef}
        className={clsx(s.searchToggle, { [s.searchToggleHidden]: open })}
        aria-label="Search updates"
        aria-expanded={open}
        aria-hidden={open}
        tabIndex={open ? -1 : 0}
        onClick={onOpen}
      >
        <SearchIcon />
      </button>
      {open && (
        <div className={s.searchField} ref={fieldRef} onBlur={onBlur} onKeyUp={onKeyUp}>
          <SearchInput value={value} onChange={onChange} placeholder="Search by team or keyword…" />
        </div>
      )}
    </>
  );
}

/** Uses getCategoryLabel(), not CATEGORY_CONFIG — they disagree for at least
 *  the Guide categories, and this is the source NotificationItem renders. */
export function matchesQuery(notification: PushNotification, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [notification.title, notification.description ?? '', getCategoryLabel(notification.category)]
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}
