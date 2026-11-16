'use client';

/**
 * REUSE MAP — events-page-redesign
 *
 * Mobbin references (2026-11-16):
 *   Luma Discover ........ "Explore local events" city tiles → the Gatherings band.
 *   Luma calendar list ... day headers on a dotted rail, card = time / title / host /
 *                          place / facepile / square thumb on the right → the List view.
 *   Luma side peek ....... clicking a row opens a drawer, list stays behind → EventDrawer.
 *   Meetup "From your groups" / Eventbrite List|Calendar → one toolbar: search, filter
 *                          pills, List | Month switch.
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
import { SearchInput } from '@/components/common/filters/SearchInput';
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
  FILTERS,
  THUMBS,
  at,
  dayHeading,
  dayOfSpan,
  isUpcoming,
  iso,
  listDay,
  matchesFilter,
  matchesQuery,
  spanLabel,
  upcomingGatherings,
  type CalEvent,
  type Filter,
} from './mocks';
import s from './EventsPageRedesignPrototype.module.scss';

type View = 'list' | 'month';

const SUBMIT_HREF = 'https://irl.os.pl.xyz/events/add';
const EVENTS_APP_HREF = 'https://events.plnetwork.io/calendar';

export default function EventsPageRedesignPrototype() {
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date()), []);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view: View = searchParams.get('view') === 'month' ? 'month' : 'list';
  const setView = (next: View) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'list') params.delete('view');
    else params.set('view', next);
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };

  const navExtras = useHeaderSearch(true);
  const going = useGoing('owner');
  const goingUids = useMemo(() => new Set(Object.keys(going)), [going]);

  const [filter, setFilter] = useState<Filter>('all');
  const [city, setCity] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [openUid, setOpenUid] = useState<string | null>(null);
  const [sequence, setSequence] = useState<string[]>([]);
  const [notice, setNotice] = useState<EventNotice | null>(null);

  const todayIso = today ? iso(today) : '';

  const visible = useMemo(
    () =>
      CAL_EVENTS.filter(
        (e) =>
          (!city || e.gatheringUid === city) && matchesFilter(e, filter, goingUids) && matchesQuery(e, query),
      ),
    [city, filter, goingUids, query],
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
  const clearAll = () => {
    setFilter('all');
    setCity(null);
    setQuery('');
  };
  const filtered = filter !== 'all' || !!city || !!query.trim();

  const gatherings = upcomingGatherings(todayIso);
  const cityName = city ? gatherings.find((g) => g.gathering.uid === city)?.gathering.city : null;
  const plans = CAL_EVENTS.filter((e) => goingUids.has(e.uid) && isUpcoming(e, todayIso));

  return (
    <>
      <PrototypeNavBar
        hasUnreadNews={false}
        active
        isLoggedIn
        onSignIn={() => {}}
        onSignUp={() => {}}
        {...navExtras}
      />
      <PrototypeMobileNav hasUnreadNews={false} active />

      <main className={s.page}>
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
                  const active = city === gathering.uid;
                  return (
                    <button
                      key={gathering.uid}
                      type="button"
                      aria-pressed={active}
                      className={clsx(s.gatheringCard, active && s.gatheringActive)}
                      onClick={() => setCity(active ? null : gathering.uid)}
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
            <div className={s.search}>
              <SearchInput value={query} onChange={setQuery} placeholder="Search events, hosts, cities or topics" />
            </div>
            <div className={s.pills} role="group" aria-label="Filter events">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  aria-pressed={filter === f.value}
                  className={clsx(s.pill, filter === f.value && s.pillActive)}
                  onClick={() => setFilter(f.value)}
                >
                  {f.label}
                  {f.value === 'going' && plans.length > 0 && <span className={s.pillCount}>{plans.length}</span>}
                </button>
              ))}
            </div>
            <div className={s.viewSwitch} role="tablist" aria-label="View">
              {(['list', 'month'] as View[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  role="tab"
                  aria-selected={view === v}
                  className={clsx(s.viewBtn, view === v && s.viewBtnActive)}
                  onClick={() => setView(v)}
                >
                  {v === 'list' ? 'List' : 'Month'}
                </button>
              ))}
            </div>
          </div>

          {filtered && (
            <div className={s.scopeRow}>
              <span>
                {upcoming.length} upcoming {upcoming.length === 1 ? 'event' : 'events'}
                {cityName && (
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
                  <EventCard
                    event={e}
                    day={day}
                    going={goingUids.has(e.uid)}
                    onOpen={() => onOpen(e.uid, ordered)}
                  />
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}

function EventCard({ event, day, going, onOpen }: { event: CalEvent; day: string; going: boolean; onOpen: () => void }) {
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
