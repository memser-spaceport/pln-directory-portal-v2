'use client';

/**
 * LAB-3206: feedback from the Nov 10 design review on the events prototypes.
 *
 * Two views behind one switch, so developers see both at once:
 *  1. Event drawer: the current drawer plus "I'm going" and the people going.
 *  2. Member profile: one Events section (upcoming + past, Demo Day, long lists,
 *     "Add event" for the owner).
 * Both views share one session state, so an answer in the drawer shows on the profile.
 *
 * Reuse map
 *  - Profile page: `member-profile`'s `MemberProfilePage` (imported, not changed).
 *  - Tiles, Demo Day ring, "+N" modal: `team-profile/TeamContributions.module.scss` (LAB-3078).
 *  - Drawer shell: production `@/components/common/Drawer`.
 *  - Toast: `follow-shared/FollowToast`.
 */

import clsx from 'clsx';
import { useMemo, useState } from 'react';

import { MemberProfilePage } from '../member-profile/MemberProfilePrototype';
import { MOCK_MEMBER } from '../member-profile/mocks';
import band from '../member-profile/MemberProfile.module.scss';
import { FollowToast } from '../follow-shared/FollowToast';

import { EventDrawer } from './EventDrawer';
import { EventsSection, type Viewer } from './EventsSection';
import {
  DEMO_DAY,
  PAST_EVENTS,
  SEEDED_GOING,
  UPCOMING_EVENTS,
  day,
  eventByUid,
  month,
  type Attendee,
} from './mocks';
import s from './GoingEvents.module.scss';

type View = 'drawer' | 'profile';
type Amount = 'many' | 'few';
/** uid -> "Show on my profile" */
type GoingMap = Record<string, boolean>;

const seed = (amount: Amount): GoingMap =>
  Object.fromEntries(SEEDED_GOING[amount].map((uid, i) => [uid, i !== 2]));

const FIRST_NAME = MOCK_MEMBER.name.split(' ')[0];

/* The drawer view opens on an event that nobody marked yet, so the button shows first. */
const FIRST_DRAWER = 'devconnect-side';

export default function GoingEventsPrototype() {
  const [view, setView] = useState<View>('drawer');
  const [viewer, setViewer] = useState<Viewer>('owner');
  const [amount, setAmount] = useState<Amount>('many');
  const [ownerGoing, setOwnerGoing] = useState<GoingMap>(() => seed('many'));
  const [visitorGoing, setVisitorGoing] = useState<GoingMap>({});
  const [drawerUid, setDrawerUid] = useState<string | null>(FIRST_DRAWER);
  const [notice, setNotice] = useState<string | null>(null);

  // In the drawer view and on their own profile, the reader is the owner; else a visitor.
  const readerIsOwner = view === 'drawer' || viewer === 'owner';
  const going = readerIsOwner ? ownerGoing : visitorGoing;
  const setGoing = readerIsOwner ? setOwnerGoing : setVisitorGoing;
  const you: Attendee = readerIsOwner
    ? { uid: 'you', name: `${MOCK_MEMBER.name} (you)`, team: 'Lattice Compute' }
    : { uid: 'you', name: 'Jordan Ellis (you)', team: 'Orbit Storage' };

  const flash = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(null), 4000);
  };

  const upcoming = useMemo(() => UPCOMING_EVENTS.filter((e) => e.uid in ownerGoing), [ownerGoing]);
  const hiddenUids = Object.keys(ownerGoing).filter((uid) => !ownerGoing[uid]);
  const candidates = UPCOMING_EVENTS.filter((e) => !(e.uid in ownerGoing));
  const drawerEvent = drawerUid ? eventByUid(drawerUid) : null;

  const chooseAmount = (next: Amount) => {
    setAmount(next);
    setOwnerGoing(seed(next));
  };

  const reviewBand = (
    <div className={band.demoSwitch}>
      <Switch
        label="View"
        value={view}
        options={[
          { value: 'drawer', label: 'Event drawer' },
          { value: 'profile', label: 'Member profile' },
        ]}
        onChange={(v) => {
          setView(v);
          setDrawerUid(v === 'drawer' ? FIRST_DRAWER : null);
        }}
      />
      {view === 'profile' && (
        <Switch
          label="Viewer"
          value={viewer}
          options={[
            { value: 'owner', label: 'Their own profile' },
            { value: 'member', label: 'Another member' },
          ]}
          onChange={setViewer}
        />
      )}
      <Switch
        label="Events"
        value={amount}
        options={[
          { value: 'many', label: 'Long list' },
          { value: 'few', label: 'Short list' },
        ]}
        onChange={chooseAmount}
      />
    </div>
  );

  const drawer = (
    <EventDrawer
      key={drawerUid ?? 'none'}
      event={drawerEvent}
      going={!!drawerEvent && drawerEvent.uid in going}
      showOnProfile={!!drawerEvent && going[drawerEvent.uid] !== false}
      you={you}
      onClose={() => setDrawerUid(null)}
      onGoing={() => {
        if (!drawerEvent) return;
        setGoing((map) => ({ ...map, [drawerEvent.uid]: true }));
        flash(`You're going to ${drawerEvent.name}.`);
      }}
      onNotGoing={() => {
        if (!drawerEvent) return;
        setGoing((map) => {
          const next = { ...map };
          delete next[drawerEvent.uid];
          return next;
        });
      }}
      onShowOnProfile={(value) => drawerEvent && setGoing((map) => ({ ...map, [drawerEvent.uid]: value }))}
    />
  );

  if (view === 'drawer') {
    return (
      <div className={s.page}>
        {reviewBand}
        <h1 className={s.pageTitle}>Upcoming events</h1>
        <ul className={s.eventList}>
          {UPCOMING_EVENTS.map((event) => (
            <li key={event.uid}>
              <button type="button" className={s.eventItem} onClick={() => setDrawerUid(event.uid)}>
                <span className={s.dateTile} aria-hidden>
                  <span className={s.dateMonth}>{month(event.startDate)}</span>
                  <span className={s.dateDay}>{day(event.startDate)}</span>
                </span>
                <span className={s.pickText}>
                  <span className={s.personName}>{event.name}</span>
                  <span className={s.personTeam}>
                    {event.range} · {event.city}
                  </span>
                </span>
                {event.uid in ownerGoing && <span className={s.eventItemGoing}>Going</span>}
              </button>
            </li>
          ))}
        </ul>
        {drawer}
        {notice && <FollowToast>{notice}</FollowToast>}
      </div>
    );
  }

  return (
    <>
      <MemberProfilePage
        askAi="header"
        reviewBand={reviewBand}
        isOwner={viewer === 'owner'}
        eventsHigh
        eventsSection={
          <EventsSection
            viewer={viewer}
            firstName={FIRST_NAME}
            upcoming={upcoming}
            past={PAST_EVENTS[amount]}
            demoDay={DEMO_DAY}
            hiddenUids={hiddenUids}
            candidates={candidates}
            onOpenEvent={setDrawerUid}
            onAdd={(uid, show) => {
              setOwnerGoing((map) => ({ ...map, [uid]: show }));
              flash(`You're going to ${eventByUid(uid).name}.${show ? ' It is on your profile.' : ''}`);
            }}
          />
        }
      />
      {drawer}
      {notice && <FollowToast>{notice}</FollowToast>}
    </>
  );
}

function Switch<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className={band.demoSwitchGroup}>
      <span className={band.demoSwitchLabel}>{label}</span>
      <div className={band.demoSwitchRow}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            className={clsx(band.demoSwitchBtn, { [band.active]: o.value === value })}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
