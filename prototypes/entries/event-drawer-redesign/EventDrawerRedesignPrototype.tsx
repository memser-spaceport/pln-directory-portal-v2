'use client';

/**
 * REUSE MAP — event-drawer-redesign
 *
 * Pages (review band "Page"):
 *   Home ...... the `homepage` entry itself (home-v2/HomeV2Prototype), signed in by
 *               default, rendered with this entry's Upcoming events rail in its
 *               `eventsRail` slot and this entry's switches in `reviewExtra`.
 *               Not forked, so Home here stays the Home under review.
 *   Events .... /events/all copied: production ScheduleSection's header and SCSS,
 *               the embedded PL events app drawn as it renders (EventsCalendarPage).
 *
 * The drawer (review band "Drawer"):
 *   Redesign .. EventDrawer: DS Drawer, Button, Badge, Checkbox, SearchInput,
 *               icons; production IrlGatheringModal PlanningSection /
 *               AdditionalDetailsSection / pickers for "Your plans"; the
 *               member-events-going going store, mocks and attendee list.
 *   Current ... what each page opens today: Home → member-events-going
 *               GatheringModal (via its HomeEventsRail); Events → the events app's
 *               own panel (member-events-going EventSummary + Register).
 *
 * Mocked: everything. Marking "going" shares member-events-going's session store,
 * so a yes here shows up on that entry's profile.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import HomeV2Prototype from '../home-v2/HomeV2Prototype';
import home from '../home-v2/HomeV2Prototype.module.scss';
import { useHeaderSearch } from '../home-ai-ask/useHeaderSearch';
import { FollowToast } from '../follow-shared/FollowToast';
import going_s from '../member-events-going/MemberEventsGoing.module.scss';
import { PrototypeMobileNav } from '../nav-shared/PrototypeMobileNav';
import { PrototypeNavBar } from '../nav-shared/PrototypeNavBar';
import feed from '../newsfeed/Newsfeed.module.scss';
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';

import type { EventNotice } from './EventDrawer';
import { EventsCalendarPage, type DrawerVersion } from './EventsCalendarPage';
import { EventsRail } from './EventsRail';
import s from './EventDrawerRedesign.module.scss';

type Page = 'home' | 'events';
type Option<T extends string> = { value: T; label: string; note: string };

const PAGE_OPTIONS: Option<Page>[] = [
  {
    value: 'home',
    label: 'Home',
    note: 'Default. The signed-in Home; Upcoming events in the rail open the drawer.',
  },
  {
    value: 'events',
    label: 'Events',
    note: '/events/all: production’s header over the embedded events calendar. Click any event.',
  },
];

const DRAWER_OPTIONS: Option<DrawerVersion>[] = [
  {
    value: 'redesign',
    label: 'Redesign',
    note: 'Default. One drawer on both pages: toolbar, who/when/where, the ask near the top, About, Agenda, the gathering.',
  },
  {
    value: 'current',
    label: 'Current',
    note: 'What each page opens today: the gathering modal on Home, the events app’s own panel on Events.',
  },
];

/* newsfeed-v0's switch chrome, as the homepage's own band draws it. */
function Switch<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className={v0.switchBar}>
      <span className={v0.switchLabel}>{label}</span>
      <div className={clsx(v0.switch, home.reviewSwitch)} role="tablist" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={value === o.value}
            className={clsx(v0.switchBtn, value === o.value && v0.switchBtnActive)}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
      <span className={clsx(v0.switchNote, feed.reviewNote)}>{options.find((o) => o.value === value)!.note}</span>
    </div>
  );
}

export default function EventDrawerRedesignPrototype() {
  const [mounted, setMounted] = useState(false);
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => {
    setMounted(true);
    setToday(new Date());
  }, []);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page: Page = searchParams.get('page') === 'events' ? 'events' : 'home';
  const drawer: DrawerVersion = searchParams.get('drawer') === 'current' ? 'current' : 'redesign';
  const navExtras = useHeaderSearch(true);

  const hrefWith = (key: string, value: string, fallback: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value === fallback) next.delete(key);
    else next.set(key, value);
    const q = next.toString();
    return q ? `${pathname}?${q}` : pathname;
  };
  const setParam = (key: string, value: string, fallback: string) =>
    router.replace(hrefWith(key, value, fallback), { scroll: false });

  const [notice, setNotice] = useState<EventNotice | null>(null);
  const onNotice = (next: EventNotice) => {
    setNotice(next);
    setTimeout(() => setNotice(null), 6000);
  };

  if (!mounted || !today) return <div className={home.mountShell} />;

  const switches = (
    <>
      <Switch label="Page" options={PAGE_OPTIONS} value={page} onChange={(v) => setParam('page', v, 'home')} />
      <Switch
        label="Drawer"
        options={DRAWER_OPTIONS}
        value={drawer}
        onChange={(v) => setParam('drawer', v, 'redesign')}
      />
    </>
  );

  if (page === 'home') {
    return (
      <HomeV2Prototype
        initialState="signed-in"
        reviewExtra={switches}
        eventsRail={drawer === 'redesign' ? <EventsRail eventsHref={hrefWith('page', 'events', 'home')} /> : undefined}
      />
    );
  }

  return (
    <>
      <PrototypeNavBar
        hasUnreadNews={false}
        active
        isLoggedIn
        onSignIn={() => {}}
        onSignUp={() => {}}
        {...navExtras}
        eventsInMore
      />
      <PrototypeMobileNav hasUnreadNews={false} active />

      <div className={feed.reviewBand}>
        <div className={feed.reviewRow}>{switches}</div>
      </div>

      <main className={s.eventsPage}>
        <EventsCalendarPage drawer={drawer} today={today} onNotice={onNotice} />
      </main>

      {notice && (
        <FollowToast>
          {notice.onProfile ? (
            <>
              <strong>{notice.eventName}</strong> is on your profile.{' '}
              <Link href="/prototypes/member-events-going" className={going_s.toastLink}>
                View profile
              </Link>
            </>
          ) : (
            <>
              You&apos;re going to <strong>{notice.eventName}</strong>.
            </>
          )}
        </FollowToast>
      )}
    </>
  );
}
