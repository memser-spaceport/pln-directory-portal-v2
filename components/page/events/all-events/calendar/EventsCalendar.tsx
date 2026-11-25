'use client';

import clsx from 'clsx';
import { useState } from 'react';

import { Button } from '@/components/common/Button';
import { CaretLeftIcon, CaretRightIcon } from '@/components/icons';
import type { AllEventsItem } from '@/services/events/all-events.types';

import { MonthGrid } from './MonthGrid';
import { WeekBoard } from './WeekBoard';
import { addDays, mondayOf, monthLabel, monthOf, stepMonth, weekLabel, type CalMode, type MonthRef } from './weeks';
import k from './Calendar.module.scss';

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
}

/**
 * The All Events Calendar view (LAB-3320): Week (the LabWeek 2023 schedule board) and Month (the events app's grid;
 * the default from 960px, LAB-3353), in one card with Today and previous / next. Days before today are greyed. The page
 * keys it on its anchor, so a linked event or a new city opens it afresh; which week or month is showing is the
 * calendar's own state. A linked past event comes later (LAB-3418): it moves the calendar unless the visitor has.
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
}: EventsCalendarProps) {
  // On the anchor itself, also when its week or month is quiet (LAB-3353: the calendar opens at today).
  const [day, setDay] = useState(anchorIso);
  const [month, setMonth] = useState<MonthRef>(() => monthOf(anchorIso));
  const [anchor, setAnchor] = useState(anchorIso);
  const [moved, setMoved] = useState(false);
  if (anchorIso !== anchor) {
    setAnchor(anchorIso);
    if (!moved) {
      setDay(anchorIso);
      setMonth(monthOf(anchorIso));
    }
  }

  const goToday = () => {
    setMoved(true);
    setDay(todayIso);
    setMonth(monthOf(todayIso));
  };
  const step = (delta: number) => {
    setMoved(true);
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
    setMoved(true);
    setDay(isoDay);
    onModeChange('week');
  };

  const monday = mondayOf(day);
  const unit = mode === 'month' ? 'month' : 'week';
  const cards = { goingUids, pastUids, highlightUid, onOpen, onPrepare };

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
        <h3 className={k.label} aria-live="polite">
          {mode === 'month' ? monthLabel(month) : weekLabel(monday)}
        </h3>
        <div className={k.nav}>
          <Button style="border" variant="neutral" size="s" onClick={goToday}>
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
