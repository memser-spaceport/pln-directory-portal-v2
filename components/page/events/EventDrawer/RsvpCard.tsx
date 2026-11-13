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
  /** Signed in with the attendance permission: the card asks. Otherwise it only says who is going. */
  canMarkGoing: boolean;
  /** The gathering's city, for "Add your plans for <city>". */
  city: string | null;
  /** The event's own page, for Register. Left out when unknown. */
  registerUrl: string | null;
  saving: boolean;
  onOpenAttendees: () => void;
  onYes: () => void;
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

/**
 * The event's "Are you going?" card (LAB-3225, LAB-3234), ported from Polina's `event-drawer-redesign/RsvpCard`
 * (2026-11-12), which both drawer prototypes share. It answers in place: "Are you going?" → "You're going", with
 * "Add your plans for <city>" and "Mark as not going".
 *
 * Deviation from the prototype, by the Nov 12 standup (LAB-3234): no "Show on my profile". Going is always visible
 * to signed-in members.
 */
export function RsvpCard({
  count,
  faces,
  going,
  canMarkGoing,
  city,
  registerUrl,
  saving,
  onOpenAttendees,
  onYes,
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

  const people =
    count > 0 ? (
      <button type="button" className={r.goingLink} onClick={onOpenAttendees}>
        <Facepile faces={faces} />
        {going ? (others > 0 ? `You and ${members(others)}` : "You're the first one going") : `${members(count)} going`}
      </button>
    ) : (
      <span className={r.nobody}>Nobody has said they are going yet.</span>
    );

  if (!canMarkGoing) {
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
          <Button type="button" size="s" onClick={onYes} disabled={saving}>
            Yes, I&apos;m going
          </Button>
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
