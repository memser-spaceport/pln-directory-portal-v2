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
  /** "Thursday, November 19", or "Tue, Dec 1 – Sat, Dec 5" for an event across days. */
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

/** Null when the start is not a date or the zone is unknown; the drawer then prints the events app's date line. */
export function eventWhen(startDate: string, endDate: string, timezone: string, allDay = false): EventWhen | null {
  if (!valid(startDate)) return null;
  if (allDay) return allDayWhen(startDate, endDate, timezone);
  const start = new Date(startDate);
  const end = valid(endDate) ? new Date(endDate) : start;
  try {
    const at = (date: Date, pattern: string) => formatInTimeZone(date, timezone, pattern);
    const oneDay = at(start, 'yyyy-MM-dd') === at(end, 'yyyy-MM-dd');
    return {
      month: at(start, 'MMM').toUpperCase(),
      day: at(start, 'd'),
      dayLine: oneDay ? at(start, 'EEEE, MMMM d') : `${at(start, 'EEE, MMM d')} – ${at(end, 'EEE, MMM d')}`,
      timeLine: `${at(start, 'h:mm a')} – ${at(end, 'h:mm a')} · ${utcZone(start, timezone)}`,
    };
  } catch {
    return null;
  }
}

/** An all-day event: its own days, read as calendar days, and "All day" in place of the times. */
function allDayWhen(startDate: string, endDate: string, timezone: string): EventWhen {
  const tz = safeTimezone(timezone);
  const startDay = eventDay(startDate, tz);
  const endDay = valid(endDate) ? eventDay(endDate, tz) : startDay;
  const at = (isoDay: string, pattern: string) => formatInTimeZone(new Date(`${isoDay}T12:00:00Z`), 'UTC', pattern);
  return {
    month: at(startDay, 'MMM').toUpperCase(),
    day: at(startDay, 'd'),
    dayLine:
      startDay === endDay
        ? at(startDay, 'EEEE, MMMM d')
        : `${at(startDay, 'EEE, MMM d')} – ${at(endDay, 'EEE, MMM d')}`,
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
