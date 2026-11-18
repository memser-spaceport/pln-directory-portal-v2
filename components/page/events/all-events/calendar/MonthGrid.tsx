import clsx from 'clsx';

import type { AllEventsItem } from '@/services/events/all-events.types';

import type { CalendarCardProps } from './WeekBoard';
import {
  WEEKDAYS,
  byStart,
  dayNumber,
  eventsBetween,
  longDay,
  monthWeeks,
  safeColor,
  spanColumns,
  type MonthRef,
} from './weeks';
import k from './Calendar.module.scss';

/**
 * Month: the events app's grid, brought back. Monday-first weeks, one tinted bar per event per week across its days,
 * the topic colour on the bar's left edge where the event starts. A day number opens that week in Week.
 */
export function MonthGrid({
  events,
  month,
  todayIso,
  onOpenWeek,
  ...cards
}: CalendarCardProps & {
  events: AllEventsItem[];
  month: MonthRef;
  todayIso: string;
  onOpenWeek: (isoDay: string) => void;
}) {
  const weeks = monthWeeks(month);
  const inMonth = (isoDay: string) => Number(isoDay.slice(5, 7)) - 1 === month.month;

  return (
    <div className={k.month}>
      <div className={k.weekdays}>
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      {weeks.map((days) => {
        const monday = days[0];
        const bars = eventsBetween(events, monday, days[6]).sort(byStart);
        return (
          <div key={monday} className={k.week}>
            {days.map((d, i) => (
              <span
                key={d}
                className={clsx(k.dayNum, !inMonth(d) && k.dayOther, d === todayIso && k.dayToday)}
                style={{ gridColumn: i + 1, gridRow: 1 }}
              >
                <span>
                  <button
                    type="button"
                    className={k.dayBtn}
                    onClick={() => onOpenWeek(d)}
                    aria-label={`${longDay(d)}: open the week`}
                  >
                    {dayNumber(d)}
                  </button>
                </span>
              </span>
            ))}
            {bars.map((e, row) => {
              const { start, end } = spanColumns(e, monday);
              const starts = e.startDay >= monday;
              const color = safeColor(e.tagColor);
              return (
                <button
                  key={e.uid}
                  type="button"
                  data-event-uid={e.uid}
                  className={clsx(k.monthBar, starts && k.barStart, e.uid === cards.highlightUid && k.barHighlight)}
                  style={{
                    gridColumn: `${start + 1} / ${end + 2}`,
                    gridRow: row + 2,
                    background: `${color}1f`,
                    borderLeftColor: starts ? color : 'transparent',
                  }}
                  title={e.name}
                  onClick={() => cards.onOpen(e.uid)}
                  onPointerEnter={() => cards.onPrepare(e.uid)}
                  onFocus={() => cards.onPrepare(e.uid)}
                >
                  {starts ? `${e.startTime} ${e.name}` : e.name}
                </button>
              );
            })}
            {/* Keeps a quiet week the app's height. */}
            <span className={k.weekFill} style={{ gridRow: bars.length + 2 }} aria-hidden />
          </div>
        );
      })}
    </div>
  );
}
