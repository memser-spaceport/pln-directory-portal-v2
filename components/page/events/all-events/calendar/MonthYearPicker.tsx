'use client';

import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { Popover } from '@base-ui-components/react/popover';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

import { CaretLeftIcon, CaretRightIcon } from '@/components/icons';
import d from '@/components/form/DateRangePicker/DateRangePicker.module.scss';
import sd from '@/components/common/filters/SortDropdown/SortDropdown.module.scss';
import type { AllEventsItem } from '@/services/events/all-events.types';

import { monthKey } from './weeks';
import s from '../AllEventsPage.module.scss';
import k from './Calendar.module.scss';

/** Every 'YYYY-MM' an event touches, from its first day to its last. */
export function monthsWithEvents(events: AllEventsItem[]): Set<string> {
  const keys = new Set<string>();
  events.forEach((e) => {
    const last = e.endDay > e.startDay ? e.endDay.slice(0, 7) : e.startDay.slice(0, 7);
    let year = Number(e.startDay.slice(0, 4));
    let month = Number(e.startDay.slice(5, 7)) - 1;
    for (let key = monthKey({ year, month }); key <= last; key = monthKey({ year, month })) {
      keys.add(key);
      month += 1;
      if (month === 12) {
        month = 0;
        year += 1;
      }
    }
  });
  return keys;
}

/**
 * Jump to a month of any year (LAB-3460, Polina's prototype `events-page-redesign/MonthYearPicker`): a "Month YYYY"
 * pill beside Today and the steppers opens a compact ‹ 2026 › grid of twelve months, with a dot under each month that
 * has an event. The grid is react-calendar's year view in DateRangePicker's `.calendarInline` card, the popover is
 * base-ui's (Escape, an outside press and focus back on the pill come with it), and the pill is Past's year pill.
 */
export function MonthYearPicker({
  year,
  month,
  label,
  events,
  onPick,
}: {
  year: number;
  /** 0–11. */
  month: number;
  /** The pill's text: the month on show, "March 2026". */
  label: string;
  events: AllEventsItem[];
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
      <Popover.Trigger
        className={clsx(sd.trigger, s.yearPicker, k.monthTrigger)}
        aria-label={`${label}: go to a month`}
      >
        {label}
        <svg className={sd.caret} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner className={k.monthPositioner} align="start" sideOffset={4} collisionPadding={16}>
          <Popover.Popup className={clsx(d.calendarInline, k.monthPopup)} aria-label="Go to a month">
            <Calendar
              view="year"
              // English names whatever the browser's language: the tiles read "November 2026" to screen readers.
              locale="en-US"
              maxDetail="year"
              minDetail="year"
              activeStartDate={new Date(shownYear, 0, 1)}
              onActiveStartDateChange={({ activeStartDate }) =>
                activeStartDate && setShownYear(activeStartDate.getFullYear())
              }
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
                busy.has(monthKey({ year: date.getFullYear(), month: date.getMonth() })) ? (
                  // A named image, so a screen reader reads the month as "November 2026 has events".
                  <span className={k.monthDot} role="img" aria-label="has events" />
                ) : null
              }
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
