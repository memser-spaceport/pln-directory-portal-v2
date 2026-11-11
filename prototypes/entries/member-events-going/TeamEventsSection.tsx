'use client';

import clsx from 'clsx';
import { useState } from 'react';

import { Button } from '@/components/common/Button';
import { DetailsSection, DetailsSectionHeader } from '@/components/common/profile/DetailsSection';
import grey from '@/components/common/profile/DetailsSection/components/DetailsSectionGreyContentContainer/DetailsSectionGreyContentContainer.module.scss';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';

import { FollowToast } from '../follow-shared/FollowToast';
import local from '../home-refactor/HomeRefactorPrototype.module.scss';
import tiles from '../team-profile/TeamContributions.module.scss';
import { MOCK_CONTRIBUTIONS, MOCK_TEAM_DEMO_DAY } from '../team-profile/mocks';

import { day, GoingMark, month } from './EventRow';
import { GatheringModal, type GatheringTarget } from './GatheringModal';
import { useGoing } from './goingStore';
import { MUTED_ROLE, PastCard, VISIBLE_PAST, VISIBLE_UPCOMING } from './MemberEventsSection';
import { GOING_EVENTS, TEAM_UPCOMING, gatheringOf, type GoingEvent, type TeamUpcoming } from './mocks';
import s from './MemberEventsGoing.module.scss';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** "MMM yyyy" → a sortable number. */
const monthKey = (date: string) => {
  const [m, y] = date.split(' ');
  return Number(y) * 12 + MONTHS.indexOf(m);
};

interface PastItem {
  uid: string;
  name: string;
  date: string;
  meta?: string;
  roles: string[];
  featured?: { label: string; href: string };
}

/**
 * Production's Contributions, recast as the member profile's past cards: the
 * team's events newest first, the city on the meta line. "Participant" is the
 * team's plain attendance, so like a member's Attendee it shows no pill.
 *
 * Demo Day leads, highlighted (2026-11-11), as it led the old tile grid: PL's
 * own programme, the one contribution a reader of a team page is likeliest to
 * look for, so it is not left to its date. Gradient ring + "Demo Day" pill, and
 * the card opens that Demo Day's page.
 */
const DEMO_DAY: PastItem = {
  uid: 'demo-day',
  name: MOCK_TEAM_DEMO_DAY.title,
  date: MOCK_TEAM_DEMO_DAY.date,
  roles: [],
  featured: { label: 'Demo Day', href: `/demoday/${MOCK_TEAM_DEMO_DAY.slug}` },
};

const PAST: PastItem[] = [
  DEMO_DAY,
  ...MOCK_CONTRIBUTIONS.map((e) => ({
    uid: e.uid,
    name: e.name,
    date: e.date,
    meta: e.location,
    roles: e.roles.filter((r) => r !== 'Participant'),
  })).sort((a, b) => monthKey(b.date) - monthKey(a.date)),
];

/**
 * The team profile's Events section, copied from the member profile's stacked
 * layout and adapted:
 *
 * - A team doesn't go anywhere; its members do. Upcoming is the events the
 *   team's members are going to and show on their own profiles, so it has no
 *   Add event, ⋯ menu or empty state: members add events from their profile.
 *   With nobody going, the group isn't drawn.
 * - The card's foot names the team's people ("3 from Protocol Labs") with
 *   their faces, rather than everyone going. Whether the reader is going too
 *   stays, as on the member card. A role the team holds (Host, Sponsor,
 *   Speaker) sits on the meta line after the city.
 * - Past is production's Contributions (this page's old tile grid and +N
 *   modal) as the member profile's past cards, with Demo Day leading, highlighted.
 */
export function TeamEventsSection({ teamName }: { teamName: string }) {
  const readerGoing = useGoing('visitor');
  const [target, setTarget] = useState<GatheringTarget | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [allUpcoming, setAllUpcoming] = useState(false);
  const [allPast, setAllPast] = useState(false);

  const upcoming = TEAM_UPCOMING.map((t) => ({ ...t, event: GOING_EVENTS.find((e) => e.uid === t.eventUid)! }))
    .filter((t) => t.event)
    .sort((a, b) => a.event.startDate.localeCompare(b.event.startDate));

  const hasUpcoming = upcoming.length > 0;
  const hasPast = PAST.length > 0;
  if (!hasUpcoming && !hasPast) return null;

  const groupLabels = hasUpcoming && hasPast;
  const title = groupLabels ? 'Events' : hasUpcoming ? `Events ${teamName} is going to` : 'Past events';
  const upcomingShown = allUpcoming ? upcoming : upcoming.slice(0, VISIBLE_UPCOMING);
  const pastShown = allPast ? PAST : PAST.slice(0, VISIBLE_PAST);

  return (
    <DetailsSection>
      <DetailsSectionHeader title={title} />

      <div className={clsx(s.panel, !groupLabels && s.panelNoTabs)}>
        {hasUpcoming && groupLabels && <h3 className={s.groupLabel}>{teamName} is going to</h3>}
        {hasUpcoming && (
          <ul className={s.cards} aria-label={`Events ${teamName} is going to`}>
            {upcomingShown.map((t) => (
              <TeamUpcomingCard
                key={t.eventUid}
                event={t.event}
                plan={t}
                teamName={teamName}
                readerGoing={!!readerGoing[t.eventUid]}
                onOpen={() => setTarget({ kind: 'event', eventUid: t.eventUid })}
              />
            ))}
          </ul>
        )}

        {hasUpcoming && !allUpcoming && upcoming.length > VISIBLE_UPCOMING && (
          <div>
            <Button style="link" variant="primary" underline={false} onClick={() => setAllUpcoming(true)}>
              Show all {upcoming.length} upcoming events
            </Button>
          </div>
        )}

        {hasPast && groupLabels && <h3 className={clsx(s.groupLabel, s.groupLabelAfter)}>Contributions</h3>}
        {hasPast && (
          <ul className={s.cards} aria-label={groupLabels ? 'Contributions' : title}>
            {pastShown.map((e) => (
              <PastCard key={e.uid} name={e.name} date={e.date} meta={e.meta} roles={e.roles} featured={e.featured} />
            ))}
          </ul>
        )}

        {hasPast && !allPast && PAST.length > VISIBLE_PAST && (
          <div>
            <Button style="link" variant="primary" underline={false} onClick={() => setAllPast(true)}>
              Show all {PAST.length} past events
            </Button>
          </div>
        )}
      </div>

      <GatheringModal
        target={target}
        scope="visitor"
        onClose={() => setTarget(null)}
        onNotice={({ eventName }) => {
          setNotice(`You're going to ${eventName}.`);
          setTimeout(() => setNotice(null), 4000);
        }}
      />

      {notice && <FollowToast>{notice}</FollowToast>}
    </DetailsSection>
  );
}

function TeamUpcomingCard({
  event,
  plan,
  teamName,
  readerGoing,
  onOpen,
}: {
  event: GoingEvent;
  plan: TeamUpcoming;
  teamName: string;
  readerGoing: boolean;
  onOpen: () => void;
}) {
  const city = gatheringOf(event).city;
  const singleDay = event.startDate === event.endDate;
  const faces = plan.members.slice(0, 3);

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
        </div>

        <div className={s.cardMeta}>
          {/* The tile already says a single day; a range needs its end. */}
          <span>{singleDay ? city : `${event.range} · ${city}`}</span>
          {plan.roles.map((role) => (
            <span key={role} className={clsx(tiles.roleTag, MUTED_ROLE[role])}>
              {role}
            </span>
          ))}
        </div>

        <div className={s.cardFoot}>
          <span className={s.people}>
            <span className={s.faces} aria-hidden>
              {faces.map((name) => (
                <img key={name} className={s.face} src={getDefaultAvatar(name)} alt="" />
              ))}
            </span>
            {plan.members.length} from {teamName}
          </span>
          {readerGoing && <GoingMark label="You're going too" />}
        </div>
      </div>
    </li>
  );
}
