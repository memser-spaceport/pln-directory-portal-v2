'use client';

import clsx from 'clsx';
import { useEffect } from 'react';

import { Button } from '@/components/common/Button';
import btn from '@/components/common/Button/Button.module.scss';
import { Checkbox } from '@/components/common/Checkbox';
import { ArrowUpRightIcon, CalendarBlankIcon, CaretRightIcon, SuccessCircleIcon } from '@/components/icons';

import { markGoing, removeGoing, setShowOnProfile, useGoing } from '../member-events-going/goingStore';

import { registerHref } from './mocks';
import { Facepile } from './RsvpCard';
import d from './EventDrawer.module.scss';
import f from './RsvpFooter.module.scss';

/**
 * Drawer version "Footer" (?drawer=footer, 2026-11-17): the RSVP press lives in a
 * bottom bar pinned to the drawer, always on screen, instead of in the card near
 * the top. One primary action per drawer, so the top card is gone in this version.
 *
 *  - Not going: who's going on the left (facepile + "N going", opens the list),
 *    Register ↗ (neutral border) and "I'm going" (the one brand press) on the right.
 *  - Going: a tick + "You're going" over "You and N members", Register ↗ stays,
 *    and leaving is a quiet text button ("Not going"), not a second press.
 *
 * The follow-ups the card used to hold after a yes (Show on my profile, Add your
 * plans for <city>) are `GoingCardCompact`, which appears in the body only once
 * you're going, where the card stood. A yes from the footer takes the card's
 * default, Show on my profile ticked; the compact card offers the untick right away.
 *
 * Every event shows Register ↗ here, as in the card: the mocks give each one a
 * registration link (Paid, Free with RSVP and Invite only alike).
 */

const SCOPE = 'owner' as const;

export function RsvpFooter({
  event,
  onOpenAttendees,
  onMarked,
  onUnmarked,
}: {
  event: { uid: string; attendeeCount: number };
  onOpenAttendees: () => void;
  onMarked: (onProfile: boolean) => void;
  onUnmarked: () => void;
}) {
  const going = useGoing(SCOPE);
  const entry = going[event.uid];
  const others = event.attendeeCount;

  /* While the bar is up, the phone hides the reviewers' comment bubble that would sit on it. */
  useEffect(() => {
    document.body.setAttribute('data-event-rsvp-footer', '');
    return () => document.body.removeAttribute('data-event-rsvp-footer');
  }, []);

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

  return (
    <div className={f.footer}>
      {entry ? (
        <div className={f.status}>
          <p className={clsx(d.cardTitle, d.cardTitleGoing, f.title)}>
            <SuccessCircleIcon width={20} height={20} />
            You&apos;re going
          </p>
          <button type="button" className={f.people} onClick={onOpenAttendees}>
            You and {others} members
          </button>
        </div>
      ) : (
        <button type="button" className={clsx(d.goingLink, f.who)} onClick={onOpenAttendees}>
          <Facepile count={others} />
          <span>{others} going</span>
        </button>
      )}

      <div className={f.actions}>
        {entry && (
          <button
            type="button"
            className={f.leave}
            onClick={() => {
              removeGoing(SCOPE, event.uid);
              onUnmarked();
            }}
          >
            Not going
          </button>
        )}
        {register}
        {!entry && (
          <Button
            size="s"
            onClick={() => {
              markGoing(SCOPE, event.uid, true);
              onMarked(true);
            }}
          >
            I&apos;m going
          </Button>
        )}
      </div>
    </div>
  );
}

/** The going follow-ups, in the body where the RSVP card stood. Nothing until you've said yes. */
export function GoingCardCompact({
  event,
  gathering,
  onOpenPlans,
}: {
  event: { uid: string };
  gathering: { city: string } | null;
  onOpenPlans: () => void;
}) {
  const going = useGoing(SCOPE);
  const entry = going[event.uid];
  if (!entry) return null;

  return (
    <div className={clsx(d.card, f.compact)}>
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
    </div>
  );
}
