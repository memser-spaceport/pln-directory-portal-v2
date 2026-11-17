'use client';

/**
 * REUSE MAP — events-page-redesign
 *
 * Mobbin references (2026-11-16):
 *   Luma Discover ........ "Explore local events" city tiles → the Gatherings band.
 *   Luma calendar list ... day headers on a dotted rail, card = time / title / host /
 *                          place / facepile / square thumb on the right → the List view.
 *   Luma side peek ....... clicking a row opens a drawer, list stays behind → EventDrawer.
 *   Meetup "From your groups" / Eventbrite List|Calendar → the Calendar | List | Map switch (the events app's views; Calendar default).
 *   Filters: the directory's left rail (Teams / Members): DashboardPagesLayout +
 *                          FiltersSidePanel + FilterSection + GenericCheckboxList /
 *                          GenericFilterToggle, holding the events app's own filters in full
 *                          (Show featured, Modes, Access Types, Focus Areas, Gatherings, Hosts)
 *                          plus Going. Phones: MobileFilterWrapper's Filters pill + sheet.
 *   Nextdoor "Your events → Going" → the "Your plans" rail.
 *
 * Imported, not forked:
 *   EventDrawer (+ RsvpCard, Attendees, Plans) ... event-drawer-redesign — so a row opens
 *                          exactly the drawer under review there.
 *   Events + details + thumbs ................... event-drawer-redesign/mocks (one list).
 *   Going store ................................. member-events-going/goingStore ('owner'),
 *                          shared with Home and the profile for the session.
 *   DS: Button, Badge, SearchInput; icons; getDefaultAvatar facepile.
 *   Nav: PrototypeNavBar / PrototypeMobileNav; FollowToast for the "you're going" toast.
 *
 * Replaces on /events/all: the "Event Calendar" header with two ShadowButtons over an iframe
 * of the events app. Everything here is mocked.
 */

import clsx from 'clsx';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { MobileFilterWrapper } from '@/components/common/filters/MobileFilterWrapper';
import DashboardPagesLayout from '@/components/core/dashboard-pages-layout/DashboardPagesLayout';
import { ArrowUpRightIcon, CaretLeftIcon, CaretRightIcon, CheckIcon, PlusIcon } from '@/components/icons';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';

import { useHeaderSearch } from '../home-ai-ask/useHeaderSearch';
import { FollowToast } from '../follow-shared/FollowToast';
import { PrototypeMobileNav } from '../nav-shared/PrototypeMobileNav';
import { PrototypeNavBar } from '../nav-shared/PrototypeNavBar';
import { useGoing } from '../member-events-going/goingStore';
import { ATTENDEES } from '../member-events-going/mocks';
import going_s from '../member-events-going/MemberEventsGoing.module.scss';
import { EventDrawer, type EventNotice } from '../event-drawer-redesign/EventDrawer';
import { ACCESS_LABEL, MODE_LABEL, startTime, venueOf } from '../event-drawer-redesign/format';

import {
  CAL_EVENTS,
  DETAILS,
  THUMBS,
  at,
  dayHeading,
  dayOfSpan,
  isUpcoming,
  iso,
  listDay,
  matchesFilters,
  matchesQuery,
  spanLabel,
  upcomingGatherings,
  type CalEvent,
  type EventFilters,
} from './mocks';
import { EventsFilterView } from './EventsFilterView';
import { EventsMap } from './EventsMap';
import { countAppliedFilters, decodeMulti, encodeMulti, useEventsFilterStore } from './eventsFilterStore';
import s from './EventsPageRedesignPrototype.module.scss';

/** The events app's three views, in its order. Calendar is the default (no ?view= param). */
type View = 'calendar' | 'list' | 'map';

const VIEW_OPTIONS: { value: View; label: string }[] = [
  { value: 'calendar', label: 'Calendar' },
  { value: 'list', label: 'List' },
  { value: 'map', label: 'Map' },
];

const SUBMIT_HREF = 'https://irl.os.pl.xyz/events/add';
const EVENTS_APP_HREF = 'https://events.plnetwork.io/calendar';

export default function EventsPageRedesignPrototype() {
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date()), []);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const viewParam = searchParams.get('view');
  const view: View = viewParam === 'list' || viewParam === 'map' ? viewParam : 'calendar';
  const setView = (next: View) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'calendar') params.delete('view');
    else params.set('view', next);
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };

  const navExtras = useHeaderSearch(true);
  const going = useGoing('owner');
  const goingUids = useMemo(() => new Set(Object.keys(going)), [going]);

  // Filters live in the rail's store (a URLSearchParams mirror, as on Teams); the page reads them.
  const { params, setParam, clearParams } = useEventsFilterStore();
  const filters: EventFilters = useMemo(
    () => ({
      going: params.get('going') === 'true',
      featured: params.get('featured') === 'true',
      mode: decodeMulti(params.get('mode')),
      access: decodeMulti(params.get('access')),
      focus: decodeMulti(params.get('focus')),
      gathering: decodeMulti(params.get('gathering')),
      host: decodeMulti(params.get('host')),
    }),
    [params],
  );
  const query = params.get('search') ?? '';
  // The city tiles and the rail's Gathering filter are one selection: a tile toggles its city in it.
  const city = filters.gathering.length === 1 ? filters.gathering[0] : null;
  const toggleGathering = (cityName: string) => {
    const next = filters.gathering.includes(cityName)
      ? filters.gathering.filter((g) => g !== cityName)
      : [...filters.gathering, cityName];
    setParam('gathering', next.length ? encodeMulti(next) : undefined);
  };
  const [openUid, setOpenUid] = useState<string | null>(null);
  const [sequence, setSequence] = useState<string[]>([]);
  const [notice, setNotice] = useState<EventNotice | null>(null);

  const todayIso = today ? iso(today) : '';

  const visible = useMemo(
    () => CAL_EVENTS.filter((e) => matchesFilters(e, filters, goingUids) && matchesQuery(e, query)),
    [filters, goingUids, query],
  );
  const upcoming = useMemo(() => visible.filter((e) => isUpcoming(e, todayIso)), [visible, todayIso]);

  if (!today) return <div className={s.mountShell} />;

  const open = (uid: string, from: CalEvent[]) => {
    setSequence(from.map((e) => e.uid));
    setOpenUid(uid);
  };
  const onNotice = (next: EventNotice) => {
    setNotice(next);
    setTimeout(() => setNotice(null), 6000);
  };
  const clearAll = clearParams;
  const filterCount = countAppliedFilters(params);
  const filtered = filterCount > 0;

  const gatherings = upcomingGatherings(todayIso);
  const cityName = city;
  // Option counts in the rail are over everything coming up, not over the current result.
  const allUpcoming = CAL_EVENTS.filter((e) => isUpcoming(e, todayIso));
  const plans = CAL_EVENTS.filter((e) => goingUids.has(e.uid) && isUpcoming(e, todayIso));

  const content = (
    <div className={s.page}>
      <div className={s.container}>
        <header className={s.header}>
          <div className={s.headerText}>
            <h1 className={s.title}>Events</h1>
            <p className={s.lede}>Gatherings, meetups and office hours across the Protocol Labs network.</p>
          </div>
          <div className={s.headerActions}>
            <a href={EVENTS_APP_HREF} target="_blank" rel="noreferrer" className={s.textLink}>
              Open PL Events <ArrowUpRightIcon width={14} height={14} />
            </a>
            <a href={SUBMIT_HREF} target="_blank" rel="noreferrer">
              <Button style="border" variant="neutral" size="s" className={s.btn}>
                <PlusIcon width={14} height={14} /> Submit an event
              </Button>
            </a>
          </div>
        </header>

        {gatherings.length > 0 && (
          <section className={s.gatherings} aria-labelledby="gatherings-title">
            <div className={s.sectionHead}>
              <h2 id="gatherings-title" className={s.sectionTitle}>
                Gatherings
              </h2>
              <span className={s.sectionNote}>Network weeks in one city. Pick one to see its events.</span>
            </div>
            <div className={s.gatheringRow}>
              {gatherings.map(({ gathering, startDate, endDate, eventCount }) => {
                const active = filters.gathering.includes(gathering.city);
                return (
                  <button
                    key={gathering.uid}
                    type="button"
                    aria-pressed={active}
                    className={clsx(s.gatheringCard, active && s.gatheringActive)}
                    onClick={() => toggleGathering(gathering.city)}
                  >
                    <span className={s.cityMark} aria-hidden>
                      {gathering.city.slice(0, 1)}
                    </span>
                    <span className={s.gatheringText}>
                      <span className={s.gatheringCity}>{gathering.city}</span>
                      <span className={s.gatheringMeta}>
                        {spanLabel(startDate, endDate)} · {eventCount} {eventCount === 1 ? 'event' : 'events'}
                      </span>
                      <span className={s.gatheringMeta}>{gathering.attendeesCount} members going</span>
                    </span>
                    {active && <CheckIcon width={16} height={16} className={s.gatheringCheck} />}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <div className={s.toolbar}>
          <h2 className={s.toolbarTitle}>Coming up</h2>
          <div className={s.viewSwitch} role="tablist" aria-label="View">
            {VIEW_OPTIONS.map(({ value: v, label }) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                className={clsx(s.viewBtn, view === v && s.viewBtnActive)}
                onClick={() => setView(v)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Phones: the directory's "Filters" pill and bottom sheet (the wrapper hides itself at
              1024px and up). Its right-hand menu is the Calendar | List | Map switch, so it is one control. */}
        <div className={s.mobileFilters}>
          <MobileFilterWrapper
            filterCount={filterCount}
            currentSort={view}
            sortOptions={VIEW_OPTIONS}
            sortByLabel="View:"
            onSortChange={(v) => setView(v as View)}
            onClearFilters={clearParams}
            renderFilter={(onClose) => (
              <EventsFilterView events={allUpcoming} goingCount={plans.length} onClose={onClose} />
            )}
          />
        </div>

        {filtered && (
          <div className={s.scopeRow}>
            <span>
              {upcoming.length} upcoming {upcoming.length === 1 ? 'event' : 'events'}
              {cityName && filterCount === 1 && (
                <>
                  {' '}
                  in <strong>{cityName}</strong>
                </>
              )}
            </span>
            <button type="button" className={s.clear} onClick={clearAll}>
              Clear all
            </button>
          </div>
        )}

        <div className={s.layout}>
          <div className={s.main}>
            {view === 'list' ? (
              <ListView events={upcoming} todayIso={todayIso} goingUids={goingUids} onOpen={open} onClear={clearAll} />
            ) : view === 'map' ? (
              <EventsMap events={upcoming} goingUids={goingUids} onOpen={open} />
            ) : (
              <MonthView
                events={visible}
                today={today}
                goingUids={goingUids}
                initialMonth={city ? at(upcoming[0]?.startDate ?? todayIso) : today}
                key={city ?? 'all'}
                onOpen={open}
              />
            )}
          </div>

          <aside className={s.rail} aria-labelledby="plans-title">
            <div className={s.railCard}>
              <h2 id="plans-title" className={s.railTitle}>
                Your plans
              </h2>
              {plans.length ? (
                <ul className={s.planList}>
                  {plans.map((e) => (
                    <li key={e.uid}>
                      <button type="button" className={s.planRow} onClick={() => open(e.uid, plans)}>
                        <DateTile isoDay={e.startDate} />
                        <span className={s.planText}>
                          <span className={s.planName}>{e.name}</span>
                          <span className={s.planMeta}>
                            {spanLabel(e.startDate, e.endDate)} · {e.city}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={s.railEmpty}>
                  Say you&apos;re going to an event and it shows here, and on your profile if you choose.
                </p>
              )}
              <Link href="/prototypes/member-events-going" className={s.railLink}>
                See them on your profile
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <PrototypeNavBar hasUnreadNews={false} active isLoggedIn onSignIn={() => {}} onSignUp={() => {}} {...navExtras} />
      <PrototypeMobileNav hasUnreadNews={false} active />

      {/* The directory's page frame: the filter rail on the left, the page beside it. */}
      <main className={s.shell}>
        <DashboardPagesLayout
          filters={<EventsFilterView events={allUpcoming} goingCount={plans.length} />}
          content={content}
        />
      </main>

      <EventDrawer
        eventUid={openUid}
        sequence={sequence}
        onNavigate={setOpenUid}
        onClose={() => setOpenUid(null)}
        onNotice={onNotice}
      />

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

/* ---------- List ---------- */

function ListView({
  events,
  todayIso,
  goingUids,
  onOpen,
  onClear,
}: {
  events: CalEvent[];
  todayIso: string;
  goingUids: Set<string>;
  onOpen: (uid: string, from: CalEvent[]) => void;
  onClear: () => void;
}) {
  if (!events.length) {
    return (
      <div className={s.empty}>
        <p className={s.emptyTitle}>No upcoming events match</p>
        <p className={s.emptyText}>Try another search or filter, or see everything coming up.</p>
        <Button style="border" variant="neutral" size="s" onClick={onClear}>
          Show all events
        </Button>
      </div>
    );
  }

  const ordered = [...events].sort((a, b) => listDay(a, todayIso).localeCompare(listDay(b, todayIso)));
  const days = ordered.reduce<{ day: string; events: CalEvent[] }[]>((acc, e) => {
    const day = listDay(e, todayIso);
    const last = acc[acc.length - 1];
    if (last?.day === day) last.events.push(e);
    else acc.push({ day, events: [e] });
    return acc;
  }, []);

  return (
    <ol className={s.timeline}>
      {days.map(({ day, events: dayEvents }) => {
        const { label, weekday } = dayHeading(day, todayIso);
        return (
          <li key={day} className={s.day}>
            <h3 className={s.dayHeading}>
              <span className={s.dayDot} aria-hidden />
              {label} <span className={s.dayWeekday}>{weekday}</span>
            </h3>
            <ul className={s.dayEvents}>
              {dayEvents.map((e) => (
                <li key={e.uid}>
                  <EventCard event={e} day={day} going={goingUids.has(e.uid)} onOpen={() => onOpen(e.uid, ordered)} />
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}

function EventCard({
  event,
  day,
  going,
  onOpen,
}: {
  event: CalEvent;
  day: string;
  going: boolean;
  onOpen: () => void;
}) {
  const detail = DETAILS[event.uid];
  const { venue } = venueOf(detail);
  const span = dayOfSpan(event, day);
  const when = [startTime(detail), span].filter(Boolean).join(' · ');
  const online = detail.mode === 'Virtual';
  const thumb = THUMBS[event.uid];

  return (
    <button type="button" className={s.card} onClick={onOpen}>
      <span className={s.cardBody}>
        <span className={s.cardWhen}>{when}</span>
        <span className={s.cardTitle}>{event.name}</span>
        <span className={s.cardMeta}>By {detail.hosts.join(', ')}</span>
        <span className={s.cardMeta}>
          <PinIcon />
          {online ? venue : `${venue}, ${event.city}`}
        </span>
        <span className={s.cardFoot}>
          {going ? (
            <Badge variant="success" className={s.goingBadge}>
              <CheckIcon width={12} height={12} /> Going
            </Badge>
          ) : (
            <span className={s.facepile} aria-hidden>
              {ATTENDEES.slice((event.attendeeCount * 3) % 40, ((event.attendeeCount * 3) % 40) + 3).map((a) => (
                <img key={a.uid} src={getDefaultAvatar(a.name)} alt="" width={20} height={20} />
              ))}
            </span>
          )}
          <span className={s.cardCount}>{event.attendeeCount} going</span>
          {detail.mode !== 'In-Person' && <Badge>{MODE_LABEL[detail.mode]}</Badge>}
          {detail.access !== 'FREE w/ RSVP' && <Badge>{ACCESS_LABEL[detail.access]}</Badge>}
        </span>
      </span>
      {thumb && <img src={thumb} alt="" className={s.thumb} width={96} height={96} />}
    </button>
  );
}

/* ---------- Month ---------- */

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function weeksOf(year: number, month: number) {
  const first = new Date(year, month, 1, 12);
  const cursor = new Date(first);
  cursor.setDate(first.getDate() - ((first.getDay() + 6) % 7));
  const last = new Date(year, month + 1, 0, 12);
  const weeks: Date[][] = [];
  while (cursor <= last) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

function MonthView({
  events,
  today,
  goingUids,
  initialMonth,
  onOpen,
}: {
  events: CalEvent[];
  today: Date;
  goingUids: Set<string>;
  initialMonth: Date;
  onOpen: (uid: string, from: CalEvent[]) => void;
}) {
  const [cursor, setCursor] = useState({ year: initialMonth.getFullYear(), month: initialMonth.getMonth() });
  const weeks = weeksOf(cursor.year, cursor.month);
  const todayIso = iso(today);
  const label = new Date(cursor.year, cursor.month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const step = (delta: number) =>
    setCursor(({ year, month }) => {
      const next = new Date(year, month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  const inMonth = events.filter((e) => {
    const first = iso(new Date(cursor.year, cursor.month, 1));
    const last = iso(new Date(cursor.year, cursor.month + 1, 0));
    return e.endDate >= first && e.startDate <= last;
  });

  return (
    <div className={s.month}>
      <div className={s.monthBar}>
        <h3 className={s.monthLabel}>{label}</h3>
        <span className={s.monthCount}>
          {inMonth.length} {inMonth.length === 1 ? 'event' : 'events'}
        </span>
        <div className={s.monthNav}>
          <Button
            style="border"
            variant="neutral"
            size="s"
            onClick={() => setCursor({ year: today.getFullYear(), month: today.getMonth() })}
          >
            Today
          </Button>
          <button type="button" className={s.iconBtn} aria-label="Previous month" onClick={() => step(-1)}>
            <CaretLeftIcon width={16} height={16} />
          </button>
          <button type="button" className={s.iconBtn} aria-label="Next month" onClick={() => step(1)}>
            <CaretRightIcon width={16} height={16} />
          </button>
        </div>
      </div>
      <div className={s.grid} role="grid">
        {WEEKDAYS.map((w) => (
          <div key={w} className={s.weekday} role="columnheader">
            {w}
          </div>
        ))}
        {weeks.flat().map((date) => {
          const day = iso(date);
          const outside = date.getMonth() !== cursor.month;
          const dayEvents = events.filter((e) => e.startDate <= day && e.endDate >= day);
          return (
            <div
              key={day}
              role="gridcell"
              className={clsx(s.cell, outside && s.cellOutside, day < todayIso && s.cellPast)}
            >
              <span className={clsx(s.cellDate, day === todayIso && s.cellToday)}>{date.getDate()}</span>
              {dayEvents.map((e) => (
                <button
                  key={e.uid}
                  type="button"
                  className={clsx(s.chip, goingUids.has(e.uid) && s.chipGoing)}
                  onClick={() => onOpen(e.uid, inMonth)}
                  title={e.name}
                >
                  {e.name}
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Small parts ---------- */

function DateTile({ isoDay }: { isoDay: string }) {
  const d = at(isoDay);
  return (
    <span className={s.dateTile} aria-hidden>
      <span className={s.dateTileMonth}>{d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</span>
      <span className={s.dateTileDay}>{d.getDate()}</span>
    </span>
  );
}

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden className={s.pin}>
      <path
        d="M8 14s4.5-4.1 4.5-7.5a4.5 4.5 0 1 0-9 0C3.5 9.9 8 14 8 14Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="6.5" r="1.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
