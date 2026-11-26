'use client';

import clsx from 'clsx';

import { Button } from '@/components/common/Button';
import btn from '@/components/common/Button/Button.module.scss';
import { ArrowUpRightIcon, CalendarBlankIcon, CaretRightIcon, SuccessCircleIcon } from '@/components/icons';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import type { EventPersonResponse } from '@/services/events/event-drawer.types';

import r from './RsvpCard.module.scss';

export interface RsvpCardProps {
  /** Members going, the viewer included when they are going. */
  count: number;
  faces: EventPersonResponse[];
  /** The viewer is going (saved, or just marked in this drawer). */
  going: boolean;
  /**
   * The card asks "Are you going?": signed in with the attendance permission, or signed out (where "Yes, I'm going"
   * starts sign-in, LAB-3271). Otherwise it only says who is going.
   */
  asks: boolean;
  /** The gathering's city, for "Add your plans for <city>". */
  city: string | null;
  /** The event's own page, for Register. Left out when unknown. */
  registerUrl: string | null;
  saving: boolean;
  /**
   * The embed (LAB-3392): going happens on LabOS, so "RSVP on LabOS ↗" opens this address in a new tab in place of
   * "Yes, I'm going", and the going count is plain text (no sign-in, no attendee list inside another site).
   */
  rsvpHref?: string | null;
  onYes: () => void;
  onOpenAttendees: () => void;
  onNotGoing: () => void;
  onOpenPlans: () => void;
}

const members = (n: number) => `${n} ${n === 1 ? 'member' : 'members'}`;

function Facepile({ faces }: { faces: EventPersonResponse[] }) {
  if (!faces.length) return null;
  return (
    <span className={r.facepile} aria-hidden>
      {faces.slice(0, 3).map((face) => (
        <img key={face.uid} src={face.image || getDefaultAvatar(face.name)} alt="" width={24} height={24} />
      ))}
    </span>
  );
}

/** "RSVP on LabOS ↗": the embed's "Yes, I'm going" (LAB-3392), a link to the event on LabOS in a new tab. */
export function RsvpLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={clsx(btn.root, btn.small, btn.fill, btn.primary, r.btn)}
    >
      RSVP on LabOS
      <ArrowUpRightIcon width={14} height={14} />
    </a>
  );
}

/**
 * The event's "Are you going?" card (LAB-3225, LAB-3234), ported from Polina's `event-drawer-redesign/RsvpCard`
 * (her a0a712c8a, 2026-11-18), which both drawer prototypes share. It sits right after the facts and answers in place:
 * "Are you going?" with "Yes, I'm going" and Register → "You're going", with "Add your plans for <city>" and
 * "Mark as not going". LAB-3361: "Yes, I'm going" is back in the card, as in the prototype; when the card scrolls
 * away, the drawer pins the same question at its foot (`RsvpBar`).
 *
 * Deviations from the prototype: no "Show on my profile", going is always visible to signed-in members (LAB-3234,
 * Nov 12 standup); the plans row says "Your role, dates and topics", since the plans sub-view edits this event's role
 * and has no events picker (LAB-3234).
 */
export function RsvpCard({
  count,
  faces,
  going,
  asks,
  city,
  registerUrl,
  saving,
  rsvpHref = null,
  onYes,
  onOpenAttendees,
  onNotGoing,
  onOpenPlans,
}: RsvpCardProps) {
  const others = Math.max(0, count - (going ? 1 : 0));

  const register = registerUrl ? (
    <a
      href={registerUrl}
      target="_blank"
      rel="noreferrer"
      className={clsx(btn.root, btn.small, btn.border, btn.neutral, r.btn)}
    >
      Register
      <ArrowUpRightIcon width={14} height={14} />
    </a>
  ) : null;

  const goingText = going
    ? others > 0
      ? `You and ${members(others)}`
      : "You're the first one going"
    : `${members(count)} going`;
  const people =
    count > 0 ? (
      rsvpHref ? (
        <span className={r.goingCount}>
          <Facepile faces={faces} />
          {goingText}
        </span>
      ) : (
        <button type="button" className={r.goingLink} onClick={onOpenAttendees}>
          <Facepile faces={faces} />
          {goingText}
        </button>
      )
    ) : (
      <span className={r.nobody}>Nobody has said they are going yet.</span>
    );

  if (!asks) {
    return (
      <div className={r.card} data-testid="rsvp-card">
        <div className={r.cardHead}>
          <p className={r.cardTitle}>Who&apos;s going</p>
          {register}
        </div>
        {people}
      </div>
    );
  }

  if (!going) {
    return (
      <div className={r.card} data-testid="rsvp-card">
        <div className={r.cardHead}>
          <p className={r.cardTitle}>Are you going?</p>
          {people}
        </div>
        <div className={r.cardActions}>
          {rsvpHref ? (
            <RsvpLink href={rsvpHref} />
          ) : (
            <Button type="button" size="s" onClick={onYes} disabled={saving}>
              Yes, I&apos;m going
            </Button>
          )}
          {register}
        </div>
      </div>
    );
  }

  return (
    <div className={r.card} data-testid="rsvp-card">
      <div className={r.goingTop}>
        <div className={r.goingText}>
          <p className={clsx(r.cardTitle, r.cardTitleGoing)}>
            <SuccessCircleIcon width={20} height={20} />
            You&apos;re going
          </p>
          {people}
        </div>
        {register}
      </div>

      <button type="button" className={r.plansRow} onClick={onOpenPlans}>
        <span className={r.plansIcon} aria-hidden>
          <CalendarBlankIcon width={18} height={18} />
        </span>
        <span className={r.plansText}>
          <span className={r.plansTitle}>{city ? `Add your plans for ${city}` : 'Add your plans'}</span>
          <span className={r.plansHint}>Your role, dates and topics</span>
        </span>
        <CaretRightIcon width={16} height={16} className={r.plansArrow} />
      </button>

      <p className={r.leaveLine}>
        Can&apos;t make it?{' '}
        <button type="button" className={r.notGoing} onClick={onNotGoing} disabled={saving}>
          Mark as not going
        </button>
      </p>
    </div>
  );
}
