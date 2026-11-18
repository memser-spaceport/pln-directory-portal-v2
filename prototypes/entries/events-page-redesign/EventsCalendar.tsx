'use client';

/**
 * The Calendar view, two modes in one card (Week | Month, Week the default since 2026-11-17), not two top-level views.
 *
 * MONTH — the events app's month grid, brought back (Nov 16 standup: "bring back the previous
 * calendar look"). Transcribed from event-drawer-redesign/EventsCalendarPage, which transcribed
 * the app itself (pln-events /embed/calendar): Monday-first weeks, one tinted bar per event per
 * week spanning its days, the tag colour on the bar's left edge where the event starts. Its
 * classes are imported from that file's stylesheet (read-only), so the look tracks it. The app's
 * green bar, the inert filters rail and the date pill are not brought back: the page's own
 * toolbar and the directory's rail do those jobs. Declared deviations:
 *   - today's disc is PL brand blue, not the app's #22c55e: white 600 text on that green is
 *     2.3:1, on brand blue it is 7:1 (AA);
 *   - a bar you are going to carries a check and 600 weight (the Going filter lists the same events);
 *   - a day number opens that day's week in Week.
 *
 * WEEK — the LabWeek 2023 schedule board, from the user's screenshot (2026-11-17), replacing the
 * hour-grid "Schedule" guessed before the real layout was seen: a header cell per day, events that
 * run several days as one card spanning their columns on top (LabWeek's Devconnect banner), then
 * each day's one-day events stacked as cards in its column. A card: title, first topic + "+n",
 * time in the event's own zone, city, and a Going mark. LabWeek's navy header and per-card host
 * logos are not copied: the header is the PL neutral/brand pair, and the tag colour edge is the
 * same mark the Month bars use.
 */

import clsx from 'clsx';
import { useMemo, useState, type CSSProperties } from 'react';

import { Button } from '@/components/common/Button';
import { CaretLeftIcon, CaretRightIcon, CheckIcon } from '@/components/icons';

import c from '../event-drawer-redesign/EventsCalendarPage.module.scss';
import { startTime, timeLine } from '../event-drawer-redesign/format';

import { DETAILS, THUMBS, addDays, at, iso, zoneOf, type CalEvent } from './mocks';
import { GoingTag } from '../events-shared/GoingTag';
import k from './EventsCalendar.module.scss';

export type CalMode = 'month' | 'week';

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

/** Monday of the week holding an ISO day. */
const mondayOf = (isoDay: string) => addDays(isoDay, -((at(isoDay).getDay() + 6) % 7));

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

export function EventsCalendar({
  events,
  todayIso,
  anchorIso,
  mode,
  onModeChange,
  goingUids,
  highlightUid,
  onOpen,
}: {
  events: CalEvent[];
  todayIso: string;
  /** The day the calendar opens on: the linked event, the chosen city's first event, or today. */
  anchorIso: string;
  mode: CalMode;
  onModeChange: (mode: CalMode) => void;
  goingUids: Set<string>;
  highlightUid: string | null;
  /** The city the page is scoped to. Unused since the Week board: each card names its own zone. */
  city?: string | null;
  onOpen: (uid: string, from: CalEvent[]) => void;
}) {
  const [month, setMonth] = useState(() => ({ year: at(anchorIso).getFullYear(), month: at(anchorIso).getMonth() }));
  // Schedule opens on the anchor, or on the first day with something on it from there.
  const [day, setDay] = useState(() => {
    const first = events
      .filter((e) => e.endDate >= anchorIso)
      .map((e) => (e.startDate < anchorIso ? anchorIso : e.startDate))
      .sort()[0];
    return first ?? anchorIso;
  });

  const stepMonth = (delta: number) =>
    setMonth(({ year, month: m }) => {
      const next = new Date(year, m + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });

  const goToday = () => {
    setMonth({ year: at(todayIso).getFullYear(), month: at(todayIso).getMonth() });
    setDay(todayIso);
  };

  const openDay = (isoDay: string) => {
    setDay(isoDay);
    onModeChange('week');
  };

  const weekStart = mondayOf(day);
  const label =
    mode === 'month'
      ? new Date(month.year, month.month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : `${at(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${at(
          addDays(weekStart, 6),
        ).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div className={k.frame}>
      <div className={k.bar}>
        <div className={k.modes} role="tablist" aria-label="Calendar mode">
          {(['week', 'month'] as CalMode[]).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              className={clsx(k.mode, mode === m && k.modeActive)}
              onClick={() => onModeChange(m)}
            >
              {m === 'month' ? 'Month' : 'Week'}
            </button>
          ))}
        </div>
        <h3 className={k.label}>{label}</h3>
        <div className={k.nav}>
          <Button style="border" variant="neutral" size="s" onClick={goToday}>
            Today
          </Button>
          <button
            type="button"
            className={k.iconBtn}
            aria-label={mode === 'month' ? 'Previous month' : 'Previous week'}
            onClick={() => (mode === 'month' ? stepMonth(-1) : setDay(addDays(day, -7)))}
          >
            <CaretLeftIcon width={16} height={16} />
          </button>
          <button
            type="button"
            className={k.iconBtn}
            aria-label={mode === 'month' ? 'Next month' : 'Next week'}
            onClick={() => (mode === 'month' ? stepMonth(1) : setDay(addDays(day, 7)))}
          >
            <CaretRightIcon width={16} height={16} />
          </button>
        </div>
      </div>

      {mode === 'month' ? (
        <MonthGrid
          events={events}
          year={month.year}
          month={month.month}
          todayIso={todayIso}
          goingUids={goingUids}
          highlightUid={highlightUid}
          onOpen={onOpen}
          onOpenDay={openDay}
        />
      ) : (
        <WeekBoard
          events={events}
          weekStart={weekStart}
          todayIso={todayIso}
          goingUids={goingUids}
          highlightUid={highlightUid}
          onOpen={onOpen}
        />
      )}
    </div>
  );
}

/* ---------- Month (the events app's grid) ---------- */

function MonthGrid({
  events,
  year,
  month,
  todayIso,
  goingUids,
  highlightUid,
  onOpen,
  onOpenDay,
}: {
  events: CalEvent[];
  year: number;
  month: number;
  todayIso: string;
  goingUids: Set<string>;
  highlightUid: string | null;
  onOpen: (uid: string, from: CalEvent[]) => void;
  onOpenDay: (isoDay: string) => void;
}) {
  const weeks = useMemo(() => weeksOf(year, month), [year, month]);
  const first = iso(new Date(year, month, 1));
  const last = iso(new Date(year, month + 1, 0));
  const inMonth = events.filter((e) => e.endDate >= first && e.startDate <= last);

  return (
    <div className={k.month}>
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
            {week.map((date, i) => {
              const d = iso(date);
              return (
                <span
                  key={d}
                  className={clsx(c.dayNum, date.getMonth() !== month && c.dayOther, d === todayIso && c.dayToday)}
                  style={{ gridColumn: i + 1, gridRow: 1 }}
                >
                  <span>
                    <button
                      type="button"
                      className={k.dayBtn}
                      onClick={() => onOpenDay(d)}
                      aria-label={`${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}: open the day's schedule`}
                    >
                      {date.getDate()}
                    </button>
                  </span>
                </span>
              );
            })}
            {bars.map((ev, row) => (
              <EventBar
                key={ev.uid}
                event={ev}
                from={from}
                to={to}
                row={row + 2}
                going={goingUids.has(ev.uid)}
                highlighted={ev.uid === highlightUid}
                onOpen={() => onOpen(ev.uid, inMonth)}
              />
            ))}
            {/* Keeps short weeks the app's height. */}
            <span className={c.weekFill} style={{ gridRow: bars.length + 2 }} aria-hidden />
          </div>
        );
      })}
    </div>
  );
}

/** EventsCalendarPage's EventBar, transcribed (it is not exported there). */
function EventBar({
  event,
  from,
  to,
  row,
  going,
  highlighted,
  onOpen,
}: {
  event: CalEvent;
  from: string;
  to: string;
  row: number;
  going: boolean;
  highlighted: boolean;
  onOpen: () => void;
}) {
  const detail = DETAILS[event.uid];
  const dayIndex = (d: string) => (at(d).getDay() + 6) % 7;
  const startCol = event.startDate < from ? 0 : dayIndex(event.startDate);
  const endCol = event.endDate > to ? 6 : dayIndex(event.endDate);
  const color = detail.tags[0]?.color ?? '#1E88E5';
  const starts = event.startDate >= from;

  return (
    <button
      type="button"
      data-event-uid={event.uid}
      className={clsx(c.bar, starts && c.barStart, going && k.barGoing, highlighted && k.barHighlight)}
      style={{
        gridColumn: `${startCol + 1} / ${endCol + 2}`,
        gridRow: row,
        background: `${color}1f`,
        borderLeftColor: starts ? color : 'transparent',
      }}
      onClick={onOpen}
      title={event.name}
    >
      {going && <CheckIcon width={10} height={10} className={k.barCheck} />}
      {starts ? `${startTime(detail)} ${event.name}` : event.name}
    </button>
  );
}

/* ---------- Week (the LabWeek 2023 schedule board) ---------- */

const spanShort = (e: CalEvent) => {
  const f = (d: string) => at(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${f(e.startDate)} – ${f(e.endDate)}`;
};

/**
 * One column per day. Events that run several days span their columns at the top (LabWeek's
 * Devconnect banner); one-day events stack as cards under their day, earliest first. Every time
 * is the event's own local time, with its zone, so a Lisbon card reads in Lisbon time.
 */
function WeekBoard({
  events,
  weekStart,
  todayIso,
  goingUids,
  highlightUid,
  onOpen,
}: {
  events: CalEvent[];
  weekStart: string;
  todayIso: string;
  goingUids: Set<string>;
  highlightUid: string | null;
  onOpen: (uid: string, from: CalEvent[]) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd = days[6];
  const inWeek = events.filter((e) => e.startDate <= weekEnd && e.endDate >= weekStart);
  const spanning = inWeek.filter((e) => e.startDate !== e.endDate);
  const byStart = (a: CalEvent, b: CalEvent) =>
    a.startDate.localeCompare(b.startDate) || startMinutes(a) - startMinutes(b);
  const single = (d: string) => inWeek.filter((e) => e.startDate === d && e.endDate === d).sort(byStart);
  const open = (uid: string) => onOpen(uid, [...spanning, ...days.flatMap(single)]);

  const cardProps = { goingUids, highlightUid, onOpen: open };
  const busyDays = days.filter((d) => single(d).length > 0);

  return (
    <div className={k.board}>
      {/* Desktop and tablet: LabWeek's seven columns. */}
      <div className={k.boardGrid}>
        {days.map((d, i) => (
          <DayHead key={d} day={d} todayIso={todayIso} style={{ gridColumn: i + 1, gridRow: 1 }} />
        ))}
        {spanning.map((e, row) => {
          const startCol = e.startDate < weekStart ? 0 : days.indexOf(e.startDate);
          const endCol = e.endDate > weekEnd ? 6 : days.indexOf(e.endDate);
          return (
            <SpanCard
              key={e.uid}
              event={e}
              style={{ gridColumn: `${startCol + 1} / ${endCol + 2}`, gridRow: row + 2 }}
              {...cardProps}
            />
          );
        })}
        {days.map((d, i) => (
          <div key={d} className={k.boardCol} style={{ gridColumn: i + 1, gridRow: spanning.length + 2 }}>
            {single(d).map((e) => (
              <DayCard key={e.uid} event={e} {...cardProps} />
            ))}
          </div>
        ))}
      </div>

      {/* Phones: seven columns don't fit, so the same cards stack by day (empty days skipped). */}
      <div className={k.boardStack}>
        {spanning.map((e) => (
          <SpanCard key={e.uid} event={e} {...cardProps} />
        ))}
        {busyDays.map((d) => (
          <div key={d} className={k.stackDay}>
            <DayHead day={d} todayIso={todayIso} long />
            {single(d).map((e) => (
              <DayCard key={e.uid} event={e} {...cardProps} />
            ))}
          </div>
        ))}
      </div>

      {inWeek.length === 0 && <p className={k.boardEmpty}>Nothing this week.</p>}
    </div>
  );
}

type CardProps = {
  goingUids: Set<string>;
  highlightUid: string | null;
  onOpen: (uid: string) => void;
};

function DayHead({
  day,
  todayIso,
  long,
  style,
}: {
  day: string;
  todayIso: string;
  long?: boolean;
  style?: CSSProperties;
}) {
  const date = at(day);
  return (
    <div
      className={clsx(k.boardHead, day === todayIso && k.boardHeadToday, day < todayIso && k.boardHeadPast)}
      style={style}
    >
      <span className={k.boardDate}>
        {long ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : date.getDate()}
      </span>
      <span className={k.boardWeekday}>
        {day === todayIso ? 'Today' : date.toLocaleDateString('en-US', { weekday: long ? 'long' : 'short' })}
      </span>
    </div>
  );
}

/** A multi-day event: one card across its days (LabWeek's Devconnect banner). */
function SpanCard({
  event,
  style,
  goingUids,
  highlightUid,
  onOpen,
}: CardProps & { event: CalEvent; style?: CSSProperties }) {
  const detail = DETAILS[event.uid];
  return (
    <button
      type="button"
      data-event-uid={event.uid}
      className={clsx(k.span, event.uid === highlightUid && k.cardHighlight)}
      style={{ ...style, ...tint(event) }}
      onClick={() => onOpen(event.uid)}
    >
      {THUMBS[event.uid] && <img className={k.spanThumb} src={THUMBS[event.uid]} alt="" width={36} height={36} />}
      <span className={k.spanText}>
        <span className={k.cardTitle}>{event.name}</span>
        <span className={k.cardMeta}>
          {spanShort(event)} · {detail.mode === 'Virtual' ? 'Online' : event.city}
        </span>
      </span>
      {goingUids.has(event.uid) && <GoingTag />}
    </button>
  );
}

/** A one-day event: title, first topic + "+n", local time, place with its zone. */
function DayCard({ event, goingUids, highlightUid, onOpen }: CardProps & { event: CalEvent }) {
  const detail = DETAILS[event.uid];
  const tags = detail.tags;
  const zone = zoneOf(detail);
  return (
    <button
      type="button"
      data-event-uid={event.uid}
      className={clsx(k.card, event.uid === highlightUid && k.cardHighlight)}
      style={tint(event)}
      onClick={() => onOpen(event.uid)}
    >
      <span className={k.cardTitle}>{event.name}</span>
      {tags[0] && (
        <span className={k.cardTags}>
          <span className={k.cardTag}>#{tags[0].name}</span>
          {tags.length > 1 && <span className={k.cardTagMore}>+{tags.length - 1}</span>}
        </span>
      )}
      <span className={k.cardMeta}>{timeLine(detail).split(' · ')[0] || 'Time TBD'}</span>
      <span className={k.cardMeta}>
        {[detail.mode === 'Virtual' ? 'Online' : event.city, zone].filter(Boolean).join(' · ')}
      </span>
      {goingUids.has(event.uid) && <GoingTag />}
    </button>
  );
}

/** The first topic's colour as a faint wash. The coloured left edge was removed 2026-11-17. */
function tint(e: CalEvent) {
  const color = DETAILS[e.uid].tags[0]?.color ?? '#1E88E5';
  return {
    background: `linear-gradient(${color}0f, ${color}0f), var(--background-base-white, #ffffff)`,
  };
}

const startMinutes = (e: CalEvent) => {
  const t = DETAILS[e.uid].dateLine.match(/(\d{2}):(\d{2})/);
  return t ? Number(t[1]) * 60 + Number(t[2]) : 0;
};
