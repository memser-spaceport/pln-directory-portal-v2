'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/common/Button';
import { Checkbox } from '@/components/common/Checkbox';
import { Modal } from '@/components/common/Modal';
import { DetailsSection, DetailsSectionHeader } from '@/components/common/profile/DetailsSection';

import memberProfile from '../member-profile/MemberProfile.module.scss';
import tiles from '../team-profile/TeamContributions.module.scss';

import { day, month, type DemoDay, type PastEvent, type UpcomingEvent } from './mocks';
import s from './GoingEvents.module.scss';

export type Viewer = 'owner' | 'member';

/* One row of four tiles for plans, two rows for history; the last slot turns into "+N". */
const UPCOMING_TILES = 4;
const PAST_TILES = 8;

const MUTED_ROLE: Record<string, string> = {
  Host: tiles.roleTagMutedHost,
  Speaker: tiles.roleTagMutedSpeaker,
  Sponsor: tiles.roleTagMutedSponsor,
};

/**
 * One Events section: "Previous event contributions" and "Events you're going
 * to" merged. Both halves use the tile of the team Contributions redesign
 * (LAB-3078), so the member and the team profile read the same way.
 *
 *  - Upcoming first (a reader can still act on it), past below.
 *  - Demo Day is one of the past tiles, with the gradient ring of LAB-3078.
 *  - A long list stops at the row limit; "+N" opens all of that half in a modal.
 */
export function EventsSection({
  viewer,
  firstName,
  upcoming,
  past,
  demoDay,
  hiddenUids,
  candidates,
  onOpenEvent,
  onAdd,
}: {
  viewer: Viewer;
  firstName: string;
  upcoming: UpcomingEvent[];
  past: PastEvent[];
  demoDay: DemoDay | null;
  /** Upcoming events the owner keeps off the profile (owner sees them with a note). */
  hiddenUids: string[];
  /** Events the owner is not going to yet, for "Add event". */
  candidates: UpcomingEvent[];
  onOpenEvent: (uid: string) => void;
  onAdd: (uid: string, showOnProfile: boolean) => void;
}) {
  const isOwner = viewer === 'owner';
  const [allOf, setAllOf] = useState<'upcoming' | 'past' | null>(null);
  const [picking, setPicking] = useState(false);

  const visibleUpcoming = isOwner ? upcoming : upcoming.filter((e) => !hiddenUids.includes(e.uid));
  const pastCount = past.length + (demoDay ? 1 : 0);
  if (!isOwner && visibleUpcoming.length === 0 && pastCount === 0) return null;

  const upcomingLabel = isOwner ? "You're going to" : `${firstName} is going to`;

  const upcomingFits = visibleUpcoming.length <= UPCOMING_TILES;
  const upcomingShown = upcomingFits ? visibleUpcoming : visibleUpcoming.slice(0, UPCOMING_TILES - 1);
  const pastFits = pastCount <= PAST_TILES;
  const pastShown = pastFits ? past : past.slice(0, PAST_TILES - 1 - (demoDay ? 1 : 0));

  return (
    <DetailsSection classes={{ root: memberProfile.card }}>
      <DetailsSectionHeader title="Events">
        {isOwner && (
          <Button style="link" variant="primary" underline={false} onClick={() => setPicking(true)}>
            + Add event
          </Button>
        )}
      </DetailsSectionHeader>

      <div className={s.groups}>
        <div className={s.group}>
          <h3 className={s.groupLabel}>
            {upcomingLabel}
            {visibleUpcoming.length > 0 && <span className={s.count}> {visibleUpcoming.length}</span>}
          </h3>
          {visibleUpcoming.length === 0 ? (
            isOwner ? (
              <p className={s.empty}>
                No upcoming events yet. Add an event, and other members see that you are going.
              </p>
            ) : null
          ) : (
            <div className={clsx(tiles.grid, s.grid)}>
              {upcomingShown.map((event) => (
                <button
                  key={event.uid}
                  type="button"
                  className={clsx(tiles.tile, s.upTile)}
                  onClick={() => onOpenEvent(event.uid)}
                >
                  <span className={s.tileDate}>
                    {month(event.startDate)} {day(event.startDate)} · {event.city}
                  </span>
                  <span className={clsx(tiles.eventName, s.upName)}>{event.name}</span>
                  {isOwner && hiddenUids.includes(event.uid) && <span className={s.hiddenNote}>Only you see this</span>}
                </button>
              ))}
              {!upcomingFits && (
                <button
                  type="button"
                  className={clsx(tiles.tile, tiles.tileMore, s.moreTile)}
                  onClick={() => setAllOf('upcoming')}
                  aria-label={`Show all ${visibleUpcoming.length} upcoming events`}
                >
                  +{visibleUpcoming.length - upcomingShown.length}
                </button>
              )}
            </div>
          )}
        </div>

        {pastCount > 0 && (
          <div className={s.group}>
            <h3 className={s.groupLabel}>
              Past events<span className={s.count}> {pastCount}</span>
            </h3>
            <div className={clsx(tiles.grid, s.grid)}>
              {demoDay && <DemoDayTile demoDay={demoDay} />}
              {pastShown.map((event) => (
                <div key={event.uid} className={tiles.tile}>
                  {event.roles.length > 0 && (
                    <div className={tiles.roleTags}>
                      {event.roles.map((role) => (
                        <span key={role} className={clsx(tiles.roleTag, MUTED_ROLE[role])}>
                          {role}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className={tiles.tileMeta}>
                    <span className={tiles.eventName}>{event.name}</span>
                    <span className={tiles.eventDate}>{event.date}</span>
                  </div>
                </div>
              ))}
              {!pastFits && (
                <button
                  type="button"
                  className={clsx(tiles.tile, tiles.tileMore)}
                  onClick={() => setAllOf('past')}
                  aria-label={`Show all ${pastCount} past events`}
                >
                  +{pastCount - pastShown.length - (demoDay ? 1 : 0)}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={allOf !== null} onClose={() => setAllOf(null)} className={tiles.modal}>
        <div className={tiles.modalHeader}>
          <span className={tiles.modalTitle}>
            {allOf === 'upcoming' ? `${upcomingLabel} (${visibleUpcoming.length})` : `Past events (${pastCount})`}
          </span>
          <button type="button" className={tiles.modalClose} onClick={() => setAllOf(null)} aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        <div className={tiles.modalBody}>
          {allOf === 'upcoming' &&
            visibleUpcoming.map((event) => (
              <button
                key={event.uid}
                type="button"
                className={clsx(tiles.modalRow, s.modalRowButton)}
                onClick={() => {
                  setAllOf(null);
                  onOpenEvent(event.uid);
                }}
              >
                <span className={tiles.modalName}>{event.name}</span>
                <span className={tiles.modalDate}>
                  {event.range} · {event.city}
                </span>
              </button>
            ))}
          {allOf === 'past' && (
            <>
              {demoDay && (
                <Link href={`/demoday/${demoDay.slug}`} className={tiles.modalRow}>
                  <span className={tiles.modalTags}>
                    <span className={clsx(tiles.roleTag, tiles.roleTagDemo)}>Demo Day</span>
                  </span>
                  <span className={tiles.modalName}>{demoDay.title}</span>
                  <span className={tiles.modalDate}>{demoDay.date}</span>
                </Link>
              )}
              {past.map((event) => (
                <div key={event.uid} className={tiles.modalRow}>
                  <span className={tiles.modalTags}>
                    {event.roles.map((role) => (
                      <span key={role} className={clsx(tiles.roleTag, MUTED_ROLE[role])}>
                        {role}
                      </span>
                    ))}
                  </span>
                  <span className={tiles.modalName}>{event.name}</span>
                  <span className={tiles.modalDate}>{event.date}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </Modal>

      {picking && (
        <AddEventModal
          candidates={candidates}
          onClose={() => setPicking(false)}
          onAdd={(uid, show) => {
            onAdd(uid, show);
            setPicking(false);
          }}
        />
      )}
    </DetailsSection>
  );
}

/** Demo Day as one past tile: the LAB-3078 gradient ring and a "Demo Day" tag, same size as the others. */
function DemoDayTile({ demoDay }: { demoDay: DemoDay }) {
  return (
    <Link
      href={`/demoday/${demoDay.slug}`}
      className={clsx(tiles.tile, tiles.demoTile)}
      aria-label={`Took part in ${demoDay.title}, view the demo day`}
    >
      <div className={tiles.roleTags}>
        <span className={clsx(tiles.roleTag, tiles.roleTagDemo)}>Demo Day</span>
      </div>
      <div className={tiles.tileMeta}>
        <span className={tiles.eventName}>{demoDay.title}</span>
        <span className={tiles.eventDate}>{demoDay.date}</span>
      </div>
    </Link>
  );
}

/** "Add event": the event list. Adding means going; "Show on my profile" is ticked by default. */
function AddEventModal({
  candidates,
  onClose,
  onAdd,
}: {
  candidates: UpcomingEvent[];
  onClose: () => void;
  onAdd: (uid: string, showOnProfile: boolean) => void;
}) {
  const [show, setShow] = useState(true);
  return (
    <Modal isOpen onClose={onClose} className={tiles.modal}>
      <div className={tiles.modalHeader}>
        <span className={tiles.modalTitle}>Add an event you&apos;re going to</span>
        <button type="button" className={tiles.modalClose} onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>
      </div>
      <div className={tiles.modalBody}>
        {candidates.length === 0 && <p className={s.empty}>You marked all upcoming events.</p>}
        {candidates.map((event) => (
          <div key={event.uid} className={s.pickRow}>
            <span className={s.dateTile} aria-hidden>
              <span className={s.dateMonth}>{month(event.startDate)}</span>
              <span className={s.dateDay}>{day(event.startDate)}</span>
            </span>
            <span className={s.pickText}>
              <span className={s.personName}>{event.name}</span>
              <span className={s.personTeam}>
                {event.range} · {event.city} · {event.attendees.length} going
              </span>
            </span>
            <Button size="xs" style="border" variant="primary" onClick={() => onAdd(event.uid, show)}>
              I&apos;m going
            </Button>
          </div>
        ))}
      </div>
      <label className={clsx(s.consent, s.pickConsent)}>
        <Checkbox checked={show} onChange={setShow} aria-label="Show on my profile" />
        <span>Show on my profile</span>
      </label>
    </Modal>
  );
}

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
