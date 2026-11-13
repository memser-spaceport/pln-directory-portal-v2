'use client';

/**
 * /events/all, copied. Production's page is `ScheduleSection`: the "Event
 * Calendar" header with its two ShadowButtons (transcribed here with the
 * production stylesheet, analytics dropped), over an iframe of the PL events
 * app's /embed/calendar/. The iframe is drawn as the app draws it (captured
 * 2026-11-11 from pln-events-dev.vercel.app/embed/calendar/): the green bar
 * (All / Single Day / Multi-Day, Views), the Filters rail, and the month grid
 * with one tinted bar per event per week.
 *
 * Simplified on purpose: Modes filter and the month arrows work; the other
 * filters, List and Map are drawn but inert. Clicking an event opens the drawer
 * chosen in the review band: the redesign, or the app's own panel (`current`,
 * `member-events-going/EventDetails`, which was transcribed from it).
 */

import clsx from 'clsx';
import { useMemo, useState } from 'react';

import { Drawer } from '@/components/common/Drawer';
import ShadowButton from '@/components/ui/ShadowButton';
import schedule from '@/components/page/events/schedule-section/schedule-section.module.scss';
import allPage from '@/app/events/all/page.module.css';

import { BackIcon, EventSummary } from '../member-events-going/EventDetails';
import e from '../member-events-going/EventDetails.module.scss';

import { AttendeesView, EventDrawer, PlansView, type EventNotice } from './EventDrawer';
import d from './EventDrawer.module.scss';
import { RsvpCard } from './RsvpCard';
import { startTime } from './format';
import { CAL_EVENTS, DETAILS, eventByUid, gatheringFor, type CalEvent } from './mocks';
import c from './EventsCalendarPage.module.scss';

export type DrawerVersion = 'redesign' | 'current';

type Mode = 'All' | 'In-Person' | 'Virtual' | 'Hybrid';

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const iso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** Monday-first weeks covering the month. */
function weeksOf(year: number, month: number) {
  const first = new Date(year, month, 1, 12);
  const start = new Date(first);
  start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
  const last = new Date(year, month + 1, 0, 12);
  const weeks: Date[][] = [];
  const cursor = new Date(start);
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

export function EventsCalendarPage({
  drawer,
  today,
  onNotice,
}: {
  drawer: DrawerVersion;
  today: Date;
  onNotice: (notice: EventNotice) => void;
}) {
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [mode, setMode] = useState<Mode>('All');
  const [openUid, setOpenUid] = useState<string | null>(null);

  const events = useMemo(
    () => CAL_EVENTS.filter((ev) => mode === 'All' || DETAILS[ev.uid].mode === mode),
    [mode],
  );
  const sequence = useMemo(() => events.map((ev) => ev.uid), [events]);
  const weeks = useMemo(() => weeksOf(cursor.year, cursor.month), [cursor]);
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const todayIso = iso(today);

  const step = (delta: number) =>
    setCursor(({ year, month }) => {
      const next = new Date(year, month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });

  return (
    <div id="schedule" className={allPage.scheduler}>
      <div className={clsx(schedule.schedule, c.schedule)}>
        <div className={schedule.schedule__hdr}>
          <h1 className={schedule.schedule__hdrTitle}>Event Calendar</h1>
          <div className={schedule.schedule__hdr__btn}>
            <a href="https://irl.os.pl.xyz/events/add" target="_blank" rel="noreferrer">
              <ShadowButton
                buttonColor="#ffffff"
                shadowColor="#156FF7"
                buttonHeight="48px"
                buttonWidth="172px"
                textColor="#0F172A"
                iconSrc="/icons/doc.svg"
              >
                Submit an Event
              </ShadowButton>
            </a>
            <a href="https://events.plnetwork.io/calendar" target="_blank" rel="noreferrer">
              <ShadowButton
                buttonColor="#3DFEB1"
                shadowColor="#156FF7"
                buttonHeight="48px"
                buttonWidth="172px"
                textColor="#0F172A"
                iconPosition="right"
                iconWidth={12}
                iconHeight={12}
                iconSrc="/icons/black-link-up-arrow.svg"
              >
                View all Events
              </ShadowButton>
            </a>
          </div>
        </div>

        {/* ---- The embedded events app ---- */}
        <div className={c.app}>
          <div className={c.appBar}>
            <div className={c.segment}>
              <span className={clsx(c.segmentItem, c.segmentActive)}>All Events</span>
              <span className={c.segmentItem}>Single Day</span>
              <span className={c.segmentItem}>Multi-Day</span>
            </div>
            <div className={c.views}>
              <span className={c.viewsLabel}>⇄ VIEWS</span>
              <span className={clsx(c.segmentItem, c.segmentActive)}>Calendar</span>
              <span className={c.segmentItem}>List</span>
              <span className={c.segmentItem}>Map</span>
            </div>
          </div>

          <div className={c.appBody}>
            <aside className={c.rail} aria-label="Filters">
              <div className={c.railHead}>
                <span className={c.railTitle}>« Filters</span>
                <button type="button" className={c.clear} onClick={() => setMode('All')}>
                  Clear All
                </button>
              </div>
              <div className={c.railRow}>
                <span>Show featured events</span>
                <span className={c.toggle} aria-hidden />
              </div>
              <div className={c.railGroup}>
                <span className={c.groupTitle}>Modes</span>
                <div className={c.modes}>
                  {(['All', 'In-Person', 'Virtual', 'Hybrid'] as Mode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={clsx(c.mode, mode === m && c.modeActive)}
                      onClick={() => setMode(m)}
                      aria-pressed={mode === m}
                    >
                      {m === 'In-Person' ? 'In person' : m}
                    </button>
                  ))}
                </div>
                {['Access Types', 'Focus Areas', 'Gatherings', 'Hosts'].map((label) => (
                  <div key={label} className={c.selectGroup}>
                    <span className={c.groupTitle}>{label}</span>
                    <span className={c.select}>
                      Select {label === 'Gatherings' ? 'Gathering' : label}
                      <span aria-hidden>▾</span>
                    </span>
                  </div>
                ))}
              </div>
            </aside>

            <div className={c.calendar}>
              <div className={c.calHead}>
                <div className={c.monthNav}>
                  <button type="button" onClick={() => step(-1)} aria-label="Previous month">
                    ‹
                  </button>
                  <span className={c.monthLabel}>{monthLabel}</span>
                  <button type="button" onClick={() => step(1)} aria-label="Next month">
                    ›
                  </button>
                </div>
                <span className={c.dateSelect}>
                  {today.toLocaleDateString('en-US')}
                  <span aria-hidden>▾</span>
                </span>
              </div>

              <div className={c.weekdays}>
                {WEEKDAYS.map((w) => (
                  <span key={w}>{w}</span>
                ))}
              </div>

              {weeks.map((week) => {
                const from = iso(week[0]);
                const to = iso(week[6]);
                const bars = events.filter((ev) => ev.startDate <= to && ev.endDate >= from);
                return (
                  <div key={from} className={c.week}>
                    {week.map((day, i) => (
                      <span
                        key={iso(day)}
                        className={clsx(
                          c.dayNum,
                          day.getMonth() !== cursor.month && c.dayOther,
                          iso(day) === todayIso && c.dayToday,
                        )}
                        style={{ gridColumn: i + 1, gridRow: 1 }}
                      >
                        <span>{day.getDate()}</span>
                      </span>
                    ))}
                    {bars.map((ev, row) => (
                      <EventBar key={ev.uid} event={ev} from={from} to={to} row={row + 2} onOpen={setOpenUid} />
                    ))}
                    {/* Keeps short weeks the app's height. */}
                    <span className={c.weekFill} style={{ gridRow: bars.length + 2 }} aria-hidden />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {drawer === 'redesign' ? (
        <EventDrawer
          eventUid={openUid}
          sequence={sequence}
          onNavigate={setOpenUid}
          onClose={() => setOpenUid(null)}
          onNotice={onNotice}
        />
      ) : (
        <AppPanel eventUid={openUid} onClose={() => setOpenUid(null)} />
      )}
    </div>
  );
}

function EventBar({
  event,
  from,
  to,
  row,
  onOpen,
}: {
  event: CalEvent;
  from: string;
  to: string;
  row: number;
  onOpen: (uid: string) => void;
}) {
  const detail = DETAILS[event.uid];
  const dayIndex = (d: string) => (new Date(`${d}T12:00:00`).getDay() + 6) % 7;
  const startCol = event.startDate < from ? 0 : dayIndex(event.startDate);
  const endCol = event.endDate > to ? 6 : dayIndex(event.endDate);
  const color = detail.tags[0]?.color ?? '#1E88E5';
  const starts = event.startDate >= from;

  return (
    <button
      type="button"
      className={clsx(c.bar, starts && c.barStart)}
      style={{
        gridColumn: `${startCol + 1} / ${endCol + 2}`,
        gridRow: row,
        background: `${color}1f`,
        borderLeftColor: starts ? color : 'transparent',
      }}
      onClick={() => onOpen(event.uid)}
    >
      {starts ? `${startTime(detail)} ${event.name}` : event.name}
    </button>
  );
}

/**
 * What /events/all opens today: the events app's own panel, as
 * `member-events-going/EventDetails` transcribed it — Back, EVENT DETAILS, the
 * logo and facts, tags, Host, Description, Agenda.
 *
 * 2026-11-12 (user: "update the drawer in the events"): the same "Are you going?"
 * card as Home's drawer, above the Agenda — the shared `RsvpCard`, answering in
 * place ("You're going", Show on my profile, Add your plans, Mark as not going),
 * with Who's going and Your plans as in-drawer views (EventDrawer's own). Register
 * moved from the footer into the card, so the panel has no footer on the event.
 */
function AppPanel({ eventUid, onClose }: { eventUid: string | null; onClose: () => void }) {
  const event = eventUid ? eventByUid(eventUid) : null;
  const width = typeof window === 'undefined' ? 778 : Math.min(778, window.innerWidth);
  const [view, setView] = useState<'event' | 'attendees' | 'plans'>('event');
  const [overlayOpen, setOverlayOpen] = useState(false);
  const gathering = event ? gatheringFor(event) : null;

  const close = () => {
    setView('event');
    onClose();
  };
  /* Escape: a picker first, then a sub-view, then the drawer (EventDrawer's order). */
  const onDrawerClose = () => {
    if (overlayOpen) return;
    if (view !== 'event') setView('event');
    else close();
  };

  return (
    <Drawer isOpen={!!event} onClose={onDrawerClose} width={width}>
      {event && view === 'event' && (
        <div className={e.root}>
          <div className={e.backBar}>
            <button type="button" className={e.back} onClick={close}>
              <BackIcon />
              Back
            </button>
          </div>
          <div className={e.body}>
            <EventSummary
              name={event.name}
              detail={DETAILS[event.uid]}
              beforeAgenda={
                <RsvpCard
                  event={event}
                  gathering={gathering}
                  onOpenAttendees={() => setView('attendees')}
                  onOpenPlans={() => setView('plans')}
                  onMarked={() => {}}
                  onUnmarked={() => {}}
                />
              }
            />
          </div>
        </div>
      )}
      {event && view !== 'event' && (
        <div className={d.root}>
          {view === 'attendees' && <AttendeesView event={event} onBack={() => setView('event')} />}
          {view === 'plans' && gathering && (
            <PlansView
              event={event}
              gathering={gathering}
              onBack={() => setView('event')}
              onOverlayChange={setOverlayOpen}
            />
          )}
        </div>
      )}
    </Drawer>
  );
}
