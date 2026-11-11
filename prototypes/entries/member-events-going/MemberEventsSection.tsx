'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useState } from 'react';
import { Menu } from '@base-ui-components/react/menu';

import { Button } from '@/components/common/Button';
import {
  DetailsSection,
  DetailsSectionGreyContentContainer,
  DetailsSectionHeader,
} from '@/components/common/profile/DetailsSection';
import grey from '@/components/common/profile/DetailsSection/components/DetailsSectionGreyContentContainer/DetailsSectionGreyContentContainer.module.scss';
import { ConfirmDialog } from '@/components/core/ConfirmDialog';
import menu from '@/components/page/home/TeamNews/components/NewsShareMenu/NewsShareMenu.module.scss';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';

import { FollowToast } from '../follow-shared/FollowToast';
import local from '../home-refactor/HomeRefactorPrototype.module.scss';
import memberProfile from '../member-profile/MemberProfile.module.scss';
import { PlTeamOnlyPill } from '../profile-shared/PlTeamOnlyPill';
import tiles from '../team-profile/TeamContributions.module.scss';

import { day, GoingMark, month } from './EventRow';
import { GatheringModal, type GatheringTarget } from './GatheringModal';
import { removeGoing, setShowOnProfile, useGoing, type GoingEntry } from './goingStore';
import { ATTENDEES, GOING_EVENTS, PAST_EVENTS, gatheringOf, type GoingEvent } from './mocks';
import s from './MemberEventsGoing.module.scss';

export type ProfileViewer = 'owner' | 'member' | 'signed-out';

export const VISIBLE_UPCOMING = 4;
export const VISIBLE_PAST = 4;

export const MUTED_ROLE: Record<string, string> = {
  Host: tiles.roleTagMutedHost,
  Speaker: tiles.roleTagMutedSpeaker,
  Sponsor: tiles.roleTagMutedSponsor,
};

/** Upcoming rows this viewer may see. Plans are for signed-in members only. */
export function useVisibleUpcoming(viewer: ProfileViewer): GoingEvent[] {
  const going = useGoing('owner');
  if (viewer === 'signed-out') return [];
  return GOING_EVENTS.filter((e) => going[e.uid] && (viewer === 'owner' || going[e.uid].showOnProfile));
}

/**
 * A profile's events answer "where can I meet this person?" and "have they been
 * part of the network?". One section holds both, stacked: what they're going to
 * on top, Contributions under it, each under its own small label. (Tabs and two
 * separate sections were tried and dropped, 2026-11-11.)
 *
 * Upcoming is cards: date tile, title and meta in the order Home's row draws an
 * event, then who else is going and whether the reader is too (Luma's
 * "Together", Meetup's "See X at…", Clubhouse's facepile cards). The whole card
 * opens the gathering modal; nothing else on it is a press except the owner's ⋯.
 *
 * Past is the same grid and tile: the date tile holds month and year, the meta
 * line holds the city, and a role shows only when it isn't plain attendance.
 * Tiles don't link, because the page production links them to is admin-only now.
 *
 * With only one half to show there are no group labels; the section title is enough.
 * The team profile's version is `TeamEventsSection`.
 */
export function MemberEventsSection({ viewer, firstName }: { viewer: ProfileViewer; firstName: string }) {
  const going = useGoing('owner');
  const readerGoing = useGoing('visitor');
  const upcoming = useVisibleUpcoming(viewer);
  const isOwner = viewer === 'owner';

  const [target, setTarget] = useState<GatheringTarget | null>(null);
  const [removing, setRemoving] = useState<GoingEvent | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [allUpcoming, setAllUpcoming] = useState(false);
  const [allPast, setAllPast] = useState(false);

  const flash = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(null), 4000);
  };

  const hasUpcomingHalf = isOwner || upcoming.length > 0;
  const hasPast = PAST_EVENTS.length > 0;
  if (!hasUpcomingHalf && !hasPast) return null;

  // Group labels only when both halves are in the section; one group is the section itself.
  const groupLabels = hasUpcomingHalf && hasPast;
  const goingTitle = isOwner ? 'Events you are going to' : 'Events ' + firstName + ' is going to';
  const title = hasUpcomingHalf && hasPast ? 'Events' : hasUpcomingHalf ? goingTitle : 'Past events';

  const upcomingShown = allUpcoming ? upcoming : upcoming.slice(0, VISIBLE_UPCOMING);
  const pastShown = allPast ? PAST_EVENTS : PAST_EVENTS.slice(0, VISIBLE_PAST);

  return (
    <DetailsSection classes={{ root: memberProfile.card }}>
      <DetailsSectionHeader title={title}>
        {isOwner && upcoming.length > 0 && (
          <Button style="link" variant="primary" underline={false} onClick={() => setTarget({ kind: 'pick' })}>
            Add event
          </Button>
        )}
      </DetailsSectionHeader>

      <div className={clsx(s.panel, !groupLabels && s.panelNoTabs)}>
        {hasUpcomingHalf && groupLabels && (
          <h3 className={s.groupLabel}>{isOwner ? "You're going to" : `${firstName} is going to`}</h3>
        )}
        {upcoming.length > 0 && (
          <ul className={s.cards} aria-label={goingTitle}>
            {upcomingShown.map((event) => {
              const entry = going[event.uid];
              return (
                <UpcomingCard
                  key={event.uid}
                  event={event}
                  entry={entry}
                  isOwner={isOwner}
                  readerGoing={!isOwner && !!readerGoing[event.uid]}
                  /* The modal's "N People going" counts the person pressing, so the card does too. */
                  count={event.attendeeCount + ((isOwner ? entry : readerGoing[event.uid]) ? 1 : 0)}
                  onOpen={() => setTarget({ kind: 'event', eventUid: event.uid })}
                  onToggle={() => setShowOnProfile('owner', event.uid, !entry.showOnProfile)}
                  onRemove={() => setRemoving(event)}
                />
              );
            })}
          </ul>
        )}

        {hasUpcomingHalf && upcoming.length === 0 && (
          <DetailsSectionGreyContentContainer>
            <div className={s.empty}>
              <span className={s.emptyText}>No upcoming events on your profile yet.</span>
              <Button size="xs" style="border" variant="primary" onClick={() => setTarget({ kind: 'pick' })}>
                Add event
              </Button>
            </div>
          </DetailsSectionGreyContentContainer>
        )}

        {!allUpcoming && upcoming.length > VISIBLE_UPCOMING && (
          <div>
            <Button style="link" variant="primary" underline={false} onClick={() => setAllUpcoming(true)}>
              Show all {upcoming.length} upcoming events
            </Button>
          </div>
        )}

        {hasPast && groupLabels && <h3 className={clsx(s.groupLabel, s.groupLabelAfter)}>Contributions</h3>}
        {hasPast && (
          <ul className={s.cards} aria-label={groupLabels ? 'Contributions' : title}>
            {pastShown.map((event) => (
              <PastCard key={event.uid} name={event.name} date={event.date} meta={event.city} roles={event.roles} />
            ))}
          </ul>
        )}

        {hasPast && !allPast && PAST_EVENTS.length > VISIBLE_PAST && (
          <div>
            <Button style="link" variant="primary" underline={false} onClick={() => setAllPast(true)}>
              Show all {PAST_EVENTS.length} past events
            </Button>
          </div>
        )}
      </div>

      <GatheringModal
        target={target}
        scope={isOwner ? 'owner' : 'visitor'}
        onClose={() => setTarget(null)}
        onNotice={({ eventName, onProfile }) =>
          flash(onProfile && isOwner ? `${eventName} is on your profile.` : `You're going to ${eventName}.`)
        }
      />

      <ConfirmDialog
        isOpen={!!removing}
        title={`Remove ${removing?.name ?? 'this event'}?`}
        desc="You'll come off the list of people going, and it leaves your profile."
        confirmTitle="Remove"
        onClose={() => setRemoving(null)}
        onConfirm={() => {
          if (removing) {
            removeGoing('owner', removing.uid);
            flash(`Removed ${removing.name}.`);
          }
          setRemoving(null);
        }}
      />

      {notice && <FollowToast>{notice}</FollowToast>}
    </DetailsSection>
  );
}

function UpcomingCard({
  event,
  entry,
  isOwner,
  readerGoing,
  count,
  onOpen,
  onToggle,
  onRemove,
}: {
  event: GoingEvent;
  entry: GoingEntry;
  isOwner: boolean;
  readerGoing: boolean;
  count: number;
  onOpen: () => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const city = gatheringOf(event).city;
  const roles = entry.roles.filter((r) => r !== 'Attendee');
  const singleDay = event.startDate === event.endDate;
  // Different faces per card, from the same list the modal's "People going" opens.
  const start = event.attendeeCount % (ATTENDEES.length - 3);
  const faces = ATTENDEES.slice(start, start + 3);

  return (
    <li className={clsx(grey.root, s.card)}>
      <span className={clsx(local.dateTile, s.cardDate)} aria-hidden>
        <span className={local.dateMonth}>{month(event.startDate)}</span>
        <span className={local.dateDay}>{day(event.startDate)}</span>
      </span>

      <div className={s.cardBody}>
        <div className={s.cardHead}>
          <button type="button" className={s.cardTitle} onClick={onOpen} aria-label={`${event.name}, ${event.range}`}>
            {event.name}
          </button>
          {isOwner && (
            <span className={s.cardMenu}>
              <RowMenu
                event={event}
                shown={entry.showOnProfile}
                onEdit={onOpen}
                onToggle={onToggle}
                onRemove={onRemove}
              />
            </span>
          )}
        </div>

        <div className={s.cardMeta}>
          {/* The tile already says a single day; a range needs its end. */}
          <span>{singleDay ? city : `${event.range} · ${city}`}</span>
          {roles.map((role) => (
            <span key={role} className={clsx(tiles.roleTag, MUTED_ROLE[role])}>
              {role}
            </span>
          ))}
        </div>

        <div className={s.cardFoot}>
          <span className={s.people}>
            <span className={s.faces} aria-hidden>
              {faces.map((a) => (
                <img key={a.uid} className={s.face} src={getDefaultAvatar(a.name)} alt="" />
              ))}
            </span>
            {count} going
          </span>
          {readerGoing && <GoingMark label="You're going too" />}
          {isOwner && !entry.showOnProfile && <PlTeamOnlyPill />}
        </div>
      </div>
    </li>
  );
}

/** One past event. Shared with the team profile's section. `date` is production's "MMM yyyy". */
export function PastCard({
  name,
  date,
  meta,
  roles,
  featured,
}: {
  name: string;
  date: string;
  /** The city, or what stands in for one. */
  meta?: string;
  /** Only roles that aren't plain attendance. */
  roles: string[];
  /**
   * A highlighted contribution (the team's Demo Day): the PL gradient ring and a
   * gradient pill naming it, from the old Contributions tiles' Demo Day tile, and
   * the whole card links to its page.
   */
  featured?: { label: string; href: string };
}) {
  const [eventMonth, year] = date.split(' ');

  return (
    <li className={clsx(grey.root, s.card, s.pastCard, featured && s.pastFeatured)}>
      <span className={clsx(local.dateTile, s.cardDate)}>
        <span className={local.dateMonth}>{eventMonth.toUpperCase()}</span>
        <span className={clsx(local.dateDay, s.pastYear)}>{year}</span>
      </span>

      <div className={s.cardBody}>
        {featured ? (
          <Link href={featured.href} className={clsx(s.pastName, s.pastLink)}>
            {name}
          </Link>
        ) : (
          <span className={s.pastName}>{name}</span>
        )}
        {/* The upcoming card's meta line: city, then any role that isn't plain attendance. */}
        <div className={s.cardMeta}>
          {featured && <span className={clsx(tiles.roleTag, tiles.roleTagDemo)}>{featured.label}</span>}
          {meta && <span>{meta}</span>}
          {roles.map((role) => (
            <span key={role} className={clsx(tiles.roleTag, MUTED_ROLE[role])}>
              {role}
            </span>
          ))}
        </div>
      </div>
    </li>
  );
}

/** The owner's rare presses, behind one icon, in production's Edit / Remove order. */
function RowMenu({
  event,
  shown,
  onEdit,
  onToggle,
  onRemove,
}: {
  event: GoingEvent;
  shown: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <Menu.Root modal={false}>
      <Menu.Trigger className={menu.iconTrigger} aria-label={`Actions for ${event.name}`}>
        <DotsIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={menu.positioner} side="bottom" align="end" sideOffset={6}>
          <Menu.Popup className={menu.popup}>
            <Menu.Item className={menu.item} onClick={onEdit}>
              Edit details
            </Menu.Item>
            <Menu.Item className={menu.item} onClick={onToggle}>
              {shown ? 'Hide from my profile' : 'Show on my profile'}
            </Menu.Item>
            <Menu.Item className={clsx(menu.item, s.menuDanger)} onClick={onRemove}>
              Remove
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

const DotsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="3" cy="8" r="1.5" fill="currentColor" />
    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
    <circle cx="13" cy="8" r="1.5" fill="currentColor" />
  </svg>
);
