'use client';

import clsx from 'clsx';
import type { ReactNode } from 'react';

import { CheckIcon } from '@/components/icons';

import feed from '../newsfeed/Newsfeed.module.scss';
import local from '../home-refactor/HomeRefactorPrototype.module.scss';

import { gatheringOf, type GoingEvent } from './mocks';
import s from './MemberEventsGoing.module.scss';

export const month = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
export const day = (iso: string) => new Date(`${iso}T12:00:00`).getDate();

/**
 * One event, drawn the same way wherever it appears: Home's rail, the profile
 * and the "Add event" list. It is the rail row from `home-refactor/EventsRail`
 * (date tile, title, one line of meta), with the title as the press that opens
 * the gathering modal. The press covers the row; `trailing` sits above it so a
 * menu stays its own target.
 */
export function EventRow({
  event,
  onOpen,
  meta,
  badges,
  trailing,
}: {
  event: GoingEvent;
  onOpen: () => void;
  /** Replaces the default "range · city" line, for hosts where the tile already says the date. */
  meta?: string;
  badges?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <li className={clsx(feed.roleRow, local.jobRow, s.row)}>
      <span className={local.dateTile} aria-hidden>
        <span className={local.dateMonth}>{month(event.startDate)}</span>
        <span className={local.dateDay}>{day(event.startDate)}</span>
      </span>
      <span className={local.jobText}>
        <button
          type="button"
          className={clsx(feed.roleTitle, local.jobTitle, local.eventLink, s.rowTitle)}
          onClick={onOpen}
          aria-label={meta ? `${event.name}, ${event.range}` : undefined}
        >
          {event.name}
        </button>
        <span className={feed.roleLocation}>{meta ?? `${event.range} · ${gatheringOf(event).city}`}</span>
      </span>
      {badges && <span className={s.rowBadges}>{badges}</span>}
      {trailing && <span className={s.rowTrailing}>{trailing}</span>}
    </li>
  );
}

/** The row's receipt once you've said yes: a fact in text, not a second button. */
export function GoingMark({ label = 'Going' }: { label?: string }) {
  return (
    <span className={s.goingMark}>
      <CheckIcon aria-hidden="true" />
      {label}
    </span>
  );
}
