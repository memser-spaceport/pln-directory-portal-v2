'use client';

import clsx from 'clsx';
import { useState } from 'react';

import { Button } from '@/components/common/Button';
import btn from '@/components/common/Button/Button.module.scss';
import { Checkbox } from '@/components/common/Checkbox';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { ArrowUpRightIcon, CalendarBlankIcon, CaretRightIcon, SuccessCircleIcon } from '@/components/icons';

import { markGoing, removeGoing, setShowOnProfile, useGoing, type GoingScope } from '../member-events-going/goingStore';
import { ATTENDEES } from '../member-events-going/mocks';

import { registerHref } from './mocks';
import d from './EventDrawer.module.scss';

/**
 * The event's RSVP card: "Are you going?" until you answer, then "You're going" in place, with the plans
 * row and "Mark as not going". One component for both drawers (2026-11-12): the redesigned EventDrawer and
 * member-events-going's GatheringModal, so a yes behaves the same in either.
 */

function Facepile({ count }: { count: number }) {
  return (
    <span className={d.facepile} aria-hidden>
      {ATTENDEES.slice(0, Math.min(3, count)).map((a) => (
        <img key={a.uid} src={getDefaultAvatar(a.name)} alt="" width={24} height={24} />
      ))}
    </span>
  );
}

export function RsvpCard({
  event,
  gathering,
  scope = 'owner',
  onOpenAttendees,
  onOpenPlans,
  onMarked,
  onUnmarked,
}: {
  event: { uid: string; attendeeCount: number };
  gathering: { city: string } | null;
  scope?: GoingScope;
  onOpenAttendees: () => void;
  onOpenPlans: () => void;
  onMarked: (onProfile: boolean) => void;
  onUnmarked: () => void;
}) {
  const SCOPE = scope;
  const going = useGoing(SCOPE);
  const entry = going[event.uid];
  const [show, setShow] = useState(entry?.showOnProfile ?? true);
  const others = event.attendeeCount;

  const register = (
    <a
      href={registerHref(event.uid)}
      target="_blank"
      rel="noreferrer"
      className={clsx(btn.root, btn.small, btn.border, btn.neutral, d.btn)}
    >
      Register
      <ArrowUpRightIcon width={14} height={14} />
    </a>
  );

  const consent = (
    <label className={d.consent}>
      <Checkbox
        checked={entry ? entry.showOnProfile : show}
        onChange={(v: boolean) => (entry ? setShowOnProfile(SCOPE, event.uid, v) : setShow(v))}
        aria-labelledby={`consent-${event.uid}`}
      />
      <span className={d.consentText}>
        <span id={`consent-${event.uid}`} className={d.consentLabel}>
          Show on my profile
        </span>
        <span className={d.consentHint}>Signed-in members see it in your Events.</span>
      </span>
    </label>
  );

  if (!entry) {
    return (
      <div className={d.card}>
        <div className={d.cardHead}>
          <p className={d.cardTitle}>Are you going?</p>
          <button type="button" className={d.goingLink} onClick={onOpenAttendees}>
            <Facepile count={others} />
            {others} members going
          </button>
        </div>
        {consent}
        <div className={d.cardActions}>
          <Button
            size="s"
            onClick={() => {
              markGoing(SCOPE, event.uid, show);
              onMarked(show);
            }}
          >
            Yes, I&apos;m going
          </Button>
          {register}
        </div>
      </div>
    );
  }

  /*
   * Going, after Luma's "You're In" card in its event side peek (Mobbin, 2026-11-11):
   * a neutral card, the state as a plain dark title with one green mark, the
   * people under it, one row that leads on to the next thing to do ("Get ready
   * for the event ›" there, "Add your plans" here), and leaving as a quiet
   * sentence at the foot instead of a third press in the action row. The green
   * wash went: a tint says "the system is reporting", and nothing else on the
   * card needed to compete with the plans row.
   */
  return (
    <div className={d.card}>
      <div className={d.goingTop}>
        <div className={d.goingText}>
          <p className={clsx(d.cardTitle, d.cardTitleGoing)}>
            <SuccessCircleIcon width={20} height={20} />
            You&apos;re going
          </p>
          <button type="button" className={d.goingLink} onClick={onOpenAttendees}>
            <Facepile count={others} />
            You and {others} members
          </button>
        </div>
        {register}
      </div>

      <label className={d.consentInline}>
        <Checkbox
          checked={entry.showOnProfile}
          onChange={(v: boolean) => setShowOnProfile(SCOPE, event.uid, v)}
          aria-labelledby={`consent-${event.uid}`}
        />
        <span id={`consent-${event.uid}`} className={d.consentLabel}>
          Show on my profile <span className={d.consentQualifier}>· signed-in members see it</span>
        </span>
      </label>

      {gathering && (
        <button type="button" className={d.plansRow} onClick={onOpenPlans}>
          <span className={d.plansIcon} aria-hidden>
            <CalendarBlankIcon width={18} height={18} />
          </span>
          <span className={d.plansText}>
            <span className={d.plansTitle}>Add your plans for {gathering.city}</span>
            <span className={d.plansHint}>Dates, topics and the events you&apos;ll be at</span>
          </span>
          <CaretRightIcon width={16} height={16} className={d.plansArrow} />
        </button>
      )}

      <p className={d.leaveLine}>
        Can&apos;t make it?{' '}
        <button
          type="button"
          className={d.notGoing}
          onClick={() => {
            removeGoing(SCOPE, event.uid);
            onUnmarked();
          }}
        >
          Mark as not going
        </button>
      </p>
    </div>
  );
}

