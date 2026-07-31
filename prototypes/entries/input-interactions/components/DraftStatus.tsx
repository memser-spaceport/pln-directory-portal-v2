'use client';

import clsx from 'clsx';

import type { DraftStatus as Status } from '../hooks/useTrackedFormDraft';
import s from '../styles.module.scss';

interface Props {
  status: Status;
  savedAt: number | null;
}

function relativeTime(savedAt: number | null): string {
  if (!savedAt) return '';
  const seconds = Math.floor((Date.now() - savedAt) / 1000);
  if (seconds < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  return `${minutes}m ago`;
}

/**
 * The visible half of autosave.
 *
 * Autosave that a member can't see isn't a feature — it's a promise they have
 * no reason to believe. The chip is deliberately quiet (neutral grey while
 * writing, green once landed) so it reads as reassurance, not as an alert.
 */
export function DraftStatus({ status, savedAt }: Props) {
  if (status === 'idle') return null;

  const label =
    status === 'saving'
      ? 'Saving…'
      : status === 'restored'
        ? 'Draft restored'
        : `Draft saved · ${relativeTime(savedAt)}`;

  return (
    <span
      className={clsx(s.statusChip, {
        [s.statusChipSaved]: status === 'saved',
        [s.statusChipRestored]: status === 'restored',
      })}
      role="status"
      aria-live="polite"
    >
      <span className={clsx(s.statusDot, status === 'saving' && s.statusDotPulsing)} />
      {label}
    </span>
  );
}
