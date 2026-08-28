'use client';

/**
 * Person city calendar — five pages, each one a real route rendered at
 * production fidelity: the page shells, section chrome and member cards are all
 * imported read-only from production, so anything that looks bolted on *is*
 * bolted on.
 *
 *   My profile       /members/maya-okonkwo         — where location is edited
 *   …first time      /members/priya-raman          — the same field, cold start
 *   Members          /members                      — where it's read
 *   Someone's        /members/lucas-moreau         — how it reads to others
 *   Gathering        /events/irl?location=Berlin   — where a trip comes from
 *
 * State is shared across tabs: RSVP on the Gathering tab and the trip shows up
 * on the profile and in the directory.
 *
 * The route already renders the real SiteHeader (app/layout.tsx:78), so there
 * is deliberately no navbar here.
 */

import { useEffect, useMemo, useState } from 'react';
import { Tabs } from '@/components/common/Tabs';

import { MOCK_PEOPLE, MOCK_TRIPS, ME_ID, NEW_MEMBER, TODAY, type Trip } from './mocks';
import { GatheringTab } from './tabGathering';
import { ProfileTab } from './tabProfile';
import { MembersTab } from './tabMembers';
import s from './PersonCityCalendar.module.scss';

type TabKey = 'gathering' | 'profile' | 'members' | 'other' | 'firstrun';

/** A date when several people are travelling, so the labels have something to say. */
const LABEL_DATE = '2026-08-26';

const ROUTES: Record<TabKey, string> = {
  gathering: '/events/irl?location=Berlin',
  profile: '/members/maya-okonkwo',
  members: '/members?city=Berlin&presence=now',
  other: '/members/lucas-moreau',
  firstrun: '/members/priya-raman',
};

const ANCHORS: Record<TabKey, string> = {
  gathering: 'PlanningSection.tsx:76 (new line) · IrlGatheringModal handleSuccess (new state)',
  profile: 'EditProfileForm.tsx:360-362 — the existing Location field, extended. No new section.',
  members: 'MembersFilter — one new FilterSection. No new view mode, no new toolbar control.',
  other: 'same field, visitor state — the header chip, no Edit',
  firstrun: 'cold start — no city, no RSVPs. Nothing to confirm, so the field stands on its own.',
};

export default function PersonCityCalendarPrototype() {
  // react-calendar, the date inputs and the real Modal are interactive leaves,
  // so gate on a mounted flag: SSR === first client render, no hydration drift.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // First tab in the strip, so the prototype doesn't open on its last one.
  const [tab, setTab] = useState<TabKey>('profile');
  // Start without the Berlin trip so the Gathering tab can actually create it.
  const [trips, setTrips] = useState<Trip[]>(() => MOCK_TRIPS.filter((trip) => trip.id !== 't-me-berlin'));
  // The cold-start member's own stays, kept apart from the shared set so the
  // directory and the overlap maths never see a member with no home city.
  const [newMemberTrips, setNewMemberTrips] = useState<Trip[]>([]);
  // Set by the "Add your dates" prompt in the members results, so the hand-off
  // lands in the Location field with the picker already open — same destination
  // the RSVP flow uses, reached from the other direction.
  const [openLocationEditor, setOpenLocationEditor] = useState(false);

  const me = MOCK_PEOPLE.find((person) => person.id === ME_ID) ?? MOCK_PEOPLE[0];
  const other = MOCK_PEOPLE.find((person) => person.id === 'lucas-moreau') ?? MOCK_PEOPLE[1];
  const goingToBerlin = trips.some((trip) => trip.id === 't-me-berlin');

  const tabs = useMemo(
    () => [
      { label: 'My profile', value: 'profile', badge: goingToBerlin ? '1 new' : undefined },
      // Beside its sibling, not appended at the end: the two are the same page
      // in two states, and the cold start only means anything read against the
      // filled-in one.
      { label: 'My profile — first time edit', value: 'firstrun' },
      { label: 'Members', value: 'members' },
      { label: "Someone's profile", value: 'other' },
      { label: 'Gathering', value: 'gathering' },
    ],
    [goingToBerlin],
  );

  if (!mounted) return <div className={s.backdrop} />;

  return (
    <div className={s.backdrop}>
      <nav className={s.tabBar}>
        <div className={s.tabBarInner}>
          <Tabs tabs={tabs} value={tab} onValueChange={(value) => setTab(value as TabKey)} />
          <div className={s.routeStrip}>
            <span className={s.route}>{ROUTES[tab]}</span>
            <span className={s.anchor}>{ANCHORS[tab]}</span>
          </div>
        </div>
      </nav>

      {tab === 'gathering' && (
        <GatheringTab
          alreadyGoing={goingToBerlin}
          onGoToCalendar={() => setTab('profile')}
          onTripAdded={(trip) => setTrips((current) => [...current, trip])}
          people={MOCK_PEOPLE}
          trips={trips}
        />
      )}

      {tab === 'profile' && (
        <ProfileTab
          // Remounts when arriving from the members prompt, so the Location
          // field re-reads `startEditing` instead of keeping its closed state.
          key={openLocationEditor ? 'editing' : 'idle'}
          member={me}
          trips={trips}
          todayKey={TODAY}
          onTripsChange={setTrips}
          isOwner
          startEditing={goingToBerlin || openLocationEditor}
        />
      )}

      {tab === 'members' && (
        <MembersTab
          me={me}
          people={MOCK_PEOPLE}
          trips={trips}
          todayKey={TODAY}
          onAddDates={() => {
            setOpenLocationEditor(true);
            setTab('profile');
          }}
        />
      )}

      {tab === 'other' && <ProfileTab member={other} trips={trips} todayKey={LABEL_DATE} />}

      {tab === 'firstrun' && (
        <ProfileTab
          member={NEW_MEMBER}
          trips={newMemberTrips}
          todayKey={TODAY}
          onTripsChange={setNewMemberTrips}
          isOwner
        />
      )}
    </div>
  );
}
