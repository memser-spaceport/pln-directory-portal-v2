'use client';

import clsx from 'clsx';

import { SuccessCircleIcon } from '@/components/icons';
import type { EventPersonResponse } from '@/services/events/event-drawer.types';

import { Facepile, members } from './RsvpCard';
import r from './RsvpCard.module.scss';

export interface EndedCardProps {
  /** Members who said they were going, the viewer included when they had. */
  count: number;
  faces: EventPersonResponse[];
  /** The viewer had said they were going. */
  went: boolean;
  /**
   * Who went is not for this viewer (invite only, signed out): no count, no faces and nothing to press, whatever the
   * count is. The backend sends 0 for some invite-only events and the real count for others.
   */
  attendanceHidden: boolean;
  /** Left out in the embed, where the count is text (LAB-3392). */
  onOpenAttendees?: () => void;
}

/**
 * The going card of an event that has ended (LAB-3426), from Polina's `event-drawer-redesign` `EndedCard`: no RSVP, no
 * Register and no plans, only that it happened and who was there.
 */
export function EndedCard({ count, faces, went, attendanceHidden, onOpenAttendees }: EndedCardProps) {
  const others = Math.max(0, count - 1);
  const text = !went
    ? `${members(count)} went`
    : others > 0
      ? `You and ${members(others)}`
      : 'Nobody else said they were going.';
  const people = (
    <>
      <Facepile faces={faces} />
      {text}
    </>
  );

  return (
    <div className={r.card} data-testid="ended-card">
      <div className={r.cardHead}>
        {went ? (
          <p className={clsx(r.cardTitle, r.cardTitleGoing)}>
            <SuccessCircleIcon width={20} height={20} />
            You went
          </p>
        ) : (
          <p className={r.cardTitle}>This event has ended</p>
        )}
        {attendanceHidden ? null : count > 0 ? (
          onOpenAttendees ? (
            <button type="button" className={r.goingLink} onClick={onOpenAttendees}>
              {people}
            </button>
          ) : (
            <span className={r.goingCount}>{people}</span>
          )
        ) : (
          <span className={r.nobody}>Nobody said they were going.</span>
        )}
      </div>
    </div>
  );
}
