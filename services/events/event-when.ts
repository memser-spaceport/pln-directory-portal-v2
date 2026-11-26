import { formatInTimeZone } from 'date-fns-tz';

import { eventDay, safeTimezone } from '@/services/events/event-dates';

/*
 * When an event is, as the redesigned drawer prints it (LAB-3361, Polina's `event-drawer-redesign/format.ts`): the date
 * tile's month and day, the day line and the time line with its zone. Read in the event's own time zone, so an event
 * at 9 AM in Lisbon reads 9 AM wherever the viewer is.
 */

export interface EventWhen {
  /** "NOV", for the date tile. */
  month: string;
  /** "19", for the date tile. */
  day: string;
  /** "Thursday, November 19", or "Tue, Dec 1 – Sat, Dec 5" for an event across days; with its year, see `dayLineOf`. */
  dayLine: string;
  /** "6:00 PM – 9:00 PM · UTC−5"; "All day" for an all-day event, which has no time or zone. */
  timeLine: string;
}

const valid = (iso: string) => !Number.isNaN(new Date(iso).getTime());

/** "-05:00" → "UTC−5", "+05:30" → "UTC+5:30", "+00:00" → "UTC+0" (a real minus sign, as the prototype prints it). */
export function utcZone(date: Date, timezone: string): string {
  const match = /^([+-])(\d{2}):(\d{2})$/.exec(formatInTimeZone(date, timezone, 'xxx'));
  if (!match) return 'UTC';
  const [, sign, hours, minutes] = match;
  return `UTC${sign === '-' ? '−' : '+'}${Number(hours)}${minutes === '00' ? '' : `:${minutes}`}`;
}

/**
 * "Thursday, November 19", or "Tue, Dec 1 – Sat, Dec 5". An event that has ended (`endedAsOf`, the clock) in a year
 * other than the current one carries it (LAB-3418): "Tuesday, November 4, 2025", "Mon, Jun 30 – Fri, Jul 4, 2025", and
 * over New Year a year on each end. The current year is read in the line's own zone, through `at`.
 */
function dayLineOf(
  at: (date: Date, pattern: string) => string,
  start: Date,
  end: Date,
  endedAsOf: number | undefined,
): string {
  const [from, to] = [at(start, 'yyyy'), at(end, 'yyyy')];
  const current = endedAsOf === undefined ? null : at(new Date(endedAsOf), 'yyyy');
  const year = current === null || (from === current && to === current) ? '' : ', yyyy';
  if (at(start, 'yyyy-MM-dd') === at(end, 'yyyy-MM-dd')) return at(start, `EEEE, MMMM d${year}`);
  return `${at(start, `EEE, MMM d${from === to ? '' : year}`)} – ${at(end, `EEE, MMM d${year}`)}`;
}

/**
 * Null when the start is not a date or the zone is unknown; the drawer then prints the events app's date line.
 * `endedAsOf` is the clock, for an event that has ended (LAB-3418): its day line then carries a year other than the
 * current one. Without it the line has no year.
 */
export function eventWhen(
  startDate: string,
  endDate: string,
  timezone: string,
  allDay = false,
  endedAsOf?: number,
): EventWhen | null {
  if (!valid(startDate)) return null;
  if (allDay) return allDayWhen(startDate, endDate, timezone, endedAsOf);
  const start = new Date(startDate);
  const end = valid(endDate) ? new Date(endDate) : start;
  try {
    const at = (date: Date, pattern: string) => formatInTimeZone(date, timezone, pattern);
    // Some old events end before they start (LAB-3418). As on their card, they are on their first day, with their own
    // end time unless it reads backwards there.
    const backwards = end < start;
    const until = backwards && at(end, 'HH:mm') < at(start, 'HH:mm') ? start : end;
    return {
      month: at(start, 'MMM').toUpperCase(),
      day: at(start, 'd'),
      dayLine: dayLineOf(at, start, backwards ? start : end, endedAsOf),
      timeLine: `${at(start, 'h:mm a')} – ${at(until, 'h:mm a')} · ${utcZone(start, timezone)}`,
    };
  } catch {
    return null;
  }
}

/**
 * An all-day event: its own days, read as calendar days, and "All day" in place of the times. Ended (`endedAsOf`), its
 * day line carries a year other than the current one, as for any ended event.
 */
function allDayWhen(startDate: string, endDate: string, timezone: string, endedAsOf?: number): EventWhen {
  const tz = safeTimezone(timezone);
  const startDay = eventDay(startDate, tz);
  const endDay = valid(endDate) ? eventDay(endDate, tz) : startDay;
  const noon = (isoDay: string) => new Date(`${isoDay}T12:00:00Z`);
  const at = (date: Date, pattern: string) => formatInTimeZone(date, 'UTC', pattern);
  return {
    month: at(noon(startDay), 'MMM').toUpperCase(),
    day: at(noon(startDay), 'd'),
    dayLine: dayLineOf(at, noon(startDay), noon(endDay < startDay ? startDay : endDay), endedAsOf),
    timeLine: 'All day',
  };
}

/**
 * The event in the PL events app: its calendar opens an event from `#<event id>` (pln-events `detail-view.tsx` matches
 * the id first), and the Directory stores that id as `externalId`. Null without the id or the app's address.
 */
export function eventsAppEventHref(externalId: string | null | undefined): string | null {
  const base = process.env.PL_EVENTS_BASE_URL;
  if (!externalId || !base) return null;
  return `${base.replace(/\/+$/, '')}/calendar#${encodeURIComponent(externalId)}`;
}
