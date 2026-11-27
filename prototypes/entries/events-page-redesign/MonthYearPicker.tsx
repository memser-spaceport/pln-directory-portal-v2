'use client';

/**
 * Jump to a month of a year (2026-11-26: "a date range picker will be nicer in the calendar view
 * so people can quickly go to a month of a particular year").
 *
 * Reuse, nothing drawn from scratch:
 *   Picker ......... react-calendar, the library production's DateRangePicker
 *                    (components/form/DateRangePicker) is built on, in its year view: a
 *                    ‹ 2026 › stepper over a 3×4 grid of months. Its look is that component's
 *                    `.calendarInline` class (imported read-only): the 20px-radius card, blue
 *                    selected tile, brand-tint "now" tile. Only the month tile's padding is local.
 *   Popover ........ base-ui Popover (as FounderColumnChooser / ColumnChooser): Esc, outside click
 *                    and focus return come with it.
 *   Trigger ........ SortDropdown's trigger + caret classes with the page's `.yearPicker` override,
 *                    i.e. the exact pill the Past year picker is, so the bar keeps one vocabulary.
 * Local: the event dot under a month that has events (tileContent), and the phone width.
 */

import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { Popover } from '@base-ui-components/react/popover';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

import { CaretLeftIcon, CaretRightIcon } from '@/components/icons';
import d from '@/components/form/DateRangePicker/DateRangePicker.module.scss';
import sd from '@/components/common/filters/SortDropdown/SortDropdown.module.scss';

import { at, type CalEvent } from './mocks';
import s from './EventsPageRedesignPrototype.module.scss';
import k from './EventsCalendar.module.scss';

const pad = (n: number) => String(n).padStart(2, '0');
const monthKey = (year: number, month: number) => `${year}-${pad(month + 1)}`;

/** Every 'YYYY-MM' an event touches. */
function monthsWithEvents(events: CalEvent[]) {
  const keys = new Set<string>();
  events.forEach((e) => {
    const end = at(e.endDate);
    const cursor = new Date(at(e.startDate).getFullYear(), at(e.startDate).getMonth(), 1);
    while (cursor <= end) {
      keys.add(monthKey(cursor.getFullYear(), cursor.getMonth()));
      cursor.setMonth(cursor.getMonth() + 1);
    }
  });
  return keys;
}

export function MonthYearPicker({
  year,
  month,
  label,
  events,
  onPick,
}: {
  year: number;
  /** 0-based. */
  month: number;
  /** The trigger's text: "March 2026" in Month, the week's range in Week. */
  label: string;
  events: CalEvent[];
  onPick: (year: number, month: number) => void;
}) {
  const [open, setOpen] = useState(false);
  // The year on show in the popover; it reopens on the calendar's year.
  const [shownYear, setShownYear] = useState(year);
  const busy = useMemo(() => monthsWithEvents(events), [events]);

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        if (next) setShownYear(year);
        setOpen(next);
      }}
    >
      <Popover.Trigger className={clsx(sd.trigger, s.yearPicker, k.monthTrigger)} aria-label={`${label}: go to a month`}>
        {label}
        <svg className={sd.caret} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner className={k.monthPositioner} align="start" sideOffset={4} collisionPadding={16}>
          <Popover.Popup className={clsx(d.calendarInline, k.monthPopup)} aria-label="Go to a month">
            <Calendar
              view="year"
              maxDetail="year"
              minDetail="year"
              activeStartDate={new Date(shownYear, 0, 1)}
              onActiveStartDateChange={({ activeStartDate }) => activeStartDate && setShownYear(activeStartDate.getFullYear())}
              value={new Date(year, month, 1)}
              prev2Label={null}
              next2Label={null}
              prevLabel={<CaretLeftIcon width={16} height={16} />}
              nextLabel={<CaretRightIcon width={16} height={16} />}
              prevAriaLabel="Previous year"
              nextAriaLabel="Next year"
              formatMonth={(_, date) => date.toLocaleDateString('en-US', { month: 'short' })}
              onClickMonth={(date) => {
                onPick(date.getFullYear(), date.getMonth());
                setOpen(false);
              }}
              tileContent={({ date }) =>
                busy.has(monthKey(date.getFullYear(), date.getMonth())) ? (
                  <span className={k.monthDot} aria-label="has events" />
                ) : null
              }
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
