'use client';

import clsx from 'clsx';
import { useEffect, useLayoutEffect, useState } from 'react';

import { Button } from '@/components/common/Button';
import { CaretLeftIcon, CaretRightIcon } from '@/components/icons';
import type { AllEventsItem } from '@/services/events/all-events.types';

import { MonthGrid } from './MonthGrid';
import { MonthYearPicker } from './MonthYearPicker';
import { WeekBoard } from './WeekBoard';
import {
  addDays,
  mondayOf,
  monthEnd,
  monthKey,
  monthLabel,
  monthOf,
  monthStart,
  parseMonthKey,
  stepMonth,
  weekLabel,
  type CalMode,
  type MonthRef,
} from './weeks';
import s from '../AllEventsPage.module.scss';
import k from './Calendar.module.scss';

/** A press on the page's Live & upcoming | Past tabs (LAB-3460); `seq` changes on every press, so the same tab twice still moves the calendar. */
export interface CalendarJump {
  to: 'today' | 'past';
  seq: number;
}

const sameMonth = (a: MonthRef, b: MonthRef) => a.year === b.year && a.month === b.month;

/** The month's first day with an event on it, else its 1st: where Week lands on a picked month (the prototype's rule). */
function firstBusyDay(events: AllEventsItem[], ref: MonthRef): string {
  const first = monthStart(ref);
  const last = monthEnd(ref);
  const days = events
    .filter((e) => e.endDay >= first && e.startDay <= last)
    .map((e) => (e.startDay < first ? first : e.startDay))
    .sort();
  return days[0] ?? first;
}

/**
 * Where Past's tab takes the calendar: the latest past event, capped at the last month or week that ended before today,
 * so the period it lands on is wholly past and the tab holds. With no past event known yet, that last month or week.
 */
function latestPastDay(events: AllEventsItem[], pastUids: Set<string>, todayIso: string, mode: CalMode): string {
  const cap = mode === 'month' ? addDays(monthStart(monthOf(todayIso)), -1) : addDays(mondayOf(todayIso), -1);
  return (
    events
      .filter((e) => pastUids.has(e.uid))
      .reduce(
        (latest, e) => {
          const day = e.endDay < cap ? e.endDay : cap;
          return latest === null || day > latest ? day : latest;
        },
        null as string | null,
      ) ?? cap
  );
}

export interface EventsCalendarProps {
  events: AllEventsItem[];
  todayIso: string;
  /** The day the calendar opens on: the linked event's, the chosen city's first, or today. */
  anchorIso: string;
  mode: CalMode;
  onModeChange: (mode: CalMode) => void;
  goingUids: Set<string>;
  /** The events that have ended (LAB-3418). */
  pastUids: Set<string>;
  highlightUid: string | null;
  onOpen: (uid: string) => void;
  onPrepare: (uid: string) => void;
  /** `?month=2026-03` (LAB-3460): the month a link opens on, over the anchor. Anything else is ignored. */
  initialMonth?: string | null;
  /** The month on show, "2026-03", each time the visitor's move changes it, for the address. */
  onMonthChange?: (key: string) => void;
  /** The tabs' last press (LAB-3460): Live & upcoming moves to today, Past to the latest past event. */
  jump?: CalendarJump | null;
  /** Whether the month or week on show ended before today, so the tabs follow the calendar (LAB-3460). */
  onPeriodChange?: (past: boolean) => void;
}

/**
 * The All Events Calendar view (LAB-3320): Week (the LabWeek 2023 schedule board) and Month (the events app's grid;
 * the default from 960px, LAB-3353), in one card with Today and previous / next. Days before today are greyed. The page
 * keys it on its anchor, so a linked event or a new city opens it afresh; which week or month is showing is the
 * calendar's own state. A linked past event comes later (LAB-3418): it moves the calendar unless the visitor has.
 *
 * LAB-3460 (Polina's prototype, 2026-11-26): a "Month YYYY" pill jumps to any month of any year, the month on show goes
 * to the address once the visitor moves (`?month=`, and a link with it opens there), the page's tabs follow the period
 * on show (one that ended before today is Past), and a press on a tab moves the calendar.
 */
export function EventsCalendar({
  events,
  todayIso,
  anchorIso,
  mode,
  onModeChange,
  goingUids,
  pastUids,
  highlightUid,
  onOpen,
  onPrepare,
  initialMonth,
  onMonthChange,
  jump,
  onPeriodChange,
}: EventsCalendarProps) {
  // The address's month (`?month=`, from a link, or brought back by Back or Forward), followed until the visitor moves
  // the calendar. It wins over the anchor. Week shows the anchor's week when the anchor is in that month, else the
  // week of the month's first event, else of its 1st.
  const [follow, setFollow] = useState<MonthRef | null>(() => parseMonthKey(initialMonth));
  const landing = (ref: MonthRef) => (sameMonth(ref, monthOf(anchorIso)) ? anchorIso : firstBusyDay(events, ref));
  // On the anchor itself, also when its week or month is quiet (LAB-3353: the calendar opens at today).
  const [day, setDay] = useState(() => (follow ? landing(follow) : anchorIso));
  const [month, setMonth] = useState<MonthRef>(() => follow ?? monthOf(anchorIso));
  const [anchor, setAnchor] = useState(anchorIso);
  // The visitor's own move (a step, Today, a picked month, a tab press, a day number).
  const [moved, setMoved] = useState(false);
  if (anchorIso !== anchor) {
    setAnchor(anchorIso);
    // A followed month holds too: a linked past event that comes later doesn't take the calendar away from it.
    if (!moved && !follow) {
      setDay(anchorIso);
      setMonth(monthOf(anchorIso));
    }
  }
  // While it follows the address, Week re-lands as past events come: a past month's first event may only arrive then.
  if (follow) {
    const want = landing(follow);
    if (want !== day) setDay(want);
  }
  // Back and Forward: the address's month changes under a calendar that stays mounted. A change the calendar made
  // itself (it reports each move) is already on show; any other takes it there, or to the anchor without one.
  const [seenMonth, setSeenMonth] = useState(initialMonth || null);
  if ((initialMonth || null) !== seenMonth) {
    setSeenMonth(initialMonth || null);
    if (initialMonth !== monthKey(mode === 'month' ? month : monthOf(day))) {
      const ref = parseMonthKey(initialMonth);
      setMoved(false);
      setFollow(ref);
      setMonth(ref ?? monthOf(anchorIso));
      setDay(ref ? landing(ref) : anchorIso);
    }
  }

  const move = () => {
    setMoved(true);
    setFollow(null);
  };
  const goToday = () => {
    move();
    setDay(todayIso);
    setMonth(monthOf(todayIso));
  };

  // A tab press, taken in once (a remount doesn't replay the last one).
  const [jumpSeq, setJumpSeq] = useState(jump?.seq ?? 0);
  if (jump && jump.seq !== jumpSeq) {
    setJumpSeq(jump.seq);
    if (jump.to === 'today') goToday();
    else {
      const target = latestPastDay(events, pastUids, todayIso, mode);
      move();
      setDay(target);
      setMonth(monthOf(target));
    }
  }

  const pickMonth = (year: number, m: number) => {
    const ref = { year, month: m };
    move();
    setMonth(ref);
    setDay(firstBusyDay(events, ref));
  };
  const step = (delta: number) => {
    move();
    if (mode === 'month') setMonth((m) => stepMonth(m, delta));
    else setDay((d) => addDays(d, 7 * delta));
  };
  // Month opens on the month of the week in view, so switching never jumps away from it.
  const switchMode = (next: CalMode) => {
    if (next === mode) return;
    if (next === 'month') setMonth(monthOf(day));
    onModeChange(next);
  };
  const openWeek = (isoDay: string) => {
    move();
    setDay(isoDay);
    onModeChange('week');
  };

  const monday = mondayOf(day);
  const unit = mode === 'month' ? 'month' : 'week';
  const cards = { goingUids, pastUids, highlightUid, onOpen, onPrepare };
  // Week's month is its day's: the one the steppers and the picker move from.
  const shownMonth = mode === 'month' ? month : monthOf(day);
  const shownKey = monthKey(shownMonth);

  // The month on show goes to the address once the visitor has moved the calendar, not on opening it.
  useEffect(() => {
    if (moved) onMonthChange?.(shownKey);
  }, [moved, shownKey, onMonthChange]);

  // The tabs follow the calendar: a month or week that ended before today is Past. Before paint, so a link to a past
  // month never shows Live & upcoming first.
  const periodPast = (mode === 'month' ? monthEnd(month) : addDays(monday, 6)) < todayIso;
  useLayoutEffect(() => {
    onPeriodChange?.(periodPast);
  }, [periodPast, onPeriodChange]);
  // Without the calendar (the empty state, another view) there is no period on show: Live & upcoming.
  useLayoutEffect(() => () => onPeriodChange?.(false), [onPeriodChange]);

  return (
    <div className={k.frame} data-testid="events-calendar">
      <div className={k.bar}>
        <div className={k.modes} role="tablist" aria-label="Calendar mode">
          {(['week', 'month'] as CalMode[]).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              className={clsx(k.mode, mode === m && k.modeActive)}
              onClick={() => switchMode(m)}
            >
              {m === 'month' ? 'Month' : 'Week'}
            </button>
          ))}
        </div>
        {/* Week keeps its range as the heading; in Month the pill says the month, and the heading is for screen readers. */}
        <h3 className={mode === 'month' ? s.srOnly : k.label} aria-live="polite">
          {mode === 'month' ? monthLabel(month) : weekLabel(monday)}
        </h3>
        <div className={k.nav}>
          <MonthYearPicker
            year={shownMonth.year}
            month={shownMonth.month}
            label={monthLabel(shownMonth)}
            events={events}
            onPick={pickMonth}
          />
          <Button style="border" variant="neutral" size="s" className={k.todayBtn} onClick={goToday}>
            Today
          </Button>
          <button type="button" className={k.iconBtn} aria-label={`Previous ${unit}`} onClick={() => step(-1)}>
            <CaretLeftIcon width={16} height={16} />
          </button>
          <button type="button" className={k.iconBtn} aria-label={`Next ${unit}`} onClick={() => step(1)}>
            <CaretRightIcon width={16} height={16} />
          </button>
        </div>
      </div>

      {mode === 'month' ? (
        <MonthGrid events={events} month={month} todayIso={todayIso} onOpenWeek={openWeek} {...cards} />
      ) : (
        <WeekBoard events={events} monday={monday} todayIso={todayIso} {...cards} />
      )}
    </div>
  );
}
