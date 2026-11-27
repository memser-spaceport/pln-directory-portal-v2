import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

/*
 * How an event's dates read wherever it shows: the All Events cards, the Calendar, the Map, My Submissions and the
 * event drawer. One rule for all-day events: a date or a date range, with no start time, end time or UTC offset.
 */

const FALLBACK_TIMEZONE = 'UTC';
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** The zone itself when `date-fns-tz` can format in it, otherwise "UTC". */
export function safeTimezone(timezone: string | null | undefined): string {
  if (!timezone) return FALLBACK_TIMEZONE;
  try {
    formatInTimeZone(new Date(0), timezone, 'xxx');
    return timezone;
  } catch {
    return FALLBACK_TIMEZONE;
  }
}

function isValidDate(value: unknown): value is string | number {
  if (typeof value !== 'string' && typeof value !== 'number') return false;
  return !Number.isNaN(new Date(value).getTime());
}

/** "2026-07-24": the day of a date in the event's time zone. A date with no time of day is that day as written. */
export function eventDay(date: string, timezone: string): string {
  return DATE_ONLY.test(date) ? date : formatInTimeZone(new Date(date), timezone, 'yyyy-MM-dd');
}

/** "+05:30" → "UTC+5:30", "-03:00" → "UTC−3", "+00:00" → "UTC+0". */
export function toZoneLabel(date: Date, timezone: string): string {
  const match = /^([+-])(\d{2}):(\d{2})$/.exec(formatInTimeZone(date, timezone, 'xxx'));
  if (!match) return 'UTC+0';
  const [, sign, hours, minutes] = match;
  return `UTC${sign === '-' ? '−' : '+'}${Number(hours)}${minutes === '00' ? '' : `:${minutes}`}`;
}

export interface EventClock {
  /** "2026-12-03": the first and last day in the event's own time zone. */
  startDay: string;
  endDay: string;
  /** "9:00 AM" and "6:00 PM" in the event's time zone. Empty for an all-day event. */
  startTime: string;
  endTime: string;
  /** "UTC+5:30". Empty for an all-day event. */
  zone: string;
}

/** An event's days and clock times. An all-day event has days only: its times and its zone are empty. */
export function eventClock(startDate: string, endDate: string, timezone: string, allDay: boolean): EventClock {
  const tz = safeTimezone(timezone);
  const startDay = eventDay(startDate, tz);
  const endDay = isValidDate(endDate) ? eventDay(endDate, tz) : startDay;
  if (allDay) return { startDay, endDay, startTime: '', endTime: '', zone: '' };
  const start = new Date(startDate);
  return {
    startDay,
    endDay,
    startTime: formatInTimeZone(start, tz, 'h:mm a'),
    endTime: isValidDate(endDate) ? formatInTimeZone(new Date(endDate), tz, 'h:mm a') : '',
    zone: toZoneLabel(start, tz),
  };
}

/** The instant an event is over. An all-day event runs to the end of its last day in its time zone. */
export function eventEndsAt(endDate: string, timezone: string, allDay: boolean): Date {
  if (!allDay) return new Date(endDate);
  const tz = safeTimezone(timezone);
  return fromZonedTime(`${eventDay(endDate, tz)}T23:59:59.999`, tz);
}

/** "-05:00" → "-5:00", "+00:00" → "+0:00", as the events app prints it. */
function utcOffset(date: Date, timezone: string): string {
  const raw = formatInTimeZone(date, timezone, 'xxx');
  const match = /^([+-])0?(\d{1,2}):(\d{2})$/.exec(raw);
  return match ? `${match[1]}${match[2]}:${match[3]}` : raw;
}

/** "24th Jul 2026" from "2026-07-24". */
function longDay(isoDay: string): string {
  return formatInTimeZone(new Date(`${isoDay}T12:00:00Z`), 'UTC', 'do MMM yyyy');
}

/**
 * The drawer's date line: "19th Nov 2026, 18:00 - 19th Nov 2026, 21:00 (UTC -5:00)".
 * An all-day event reads "24th Jul 2026 - 26th Jul 2026", or "24th Jul 2026" when it is one day.
 */
export function formatEventDateLine(startDate: string, endDate: string, timezone: string, allDay = false): string {
  if (!isValidDate(startDate)) return '';
  const tz = safeTimezone(timezone);
  if (allDay) {
    const { startDay, endDay } = eventClock(startDate, endDate, tz, true);
    return startDay === endDay ? longDay(startDay) : `${longDay(startDay)} - ${longDay(endDay)}`;
  }
  const start = new Date(startDate);
  const pattern = 'do MMM yyyy, HH:mm';
  const startText = formatInTimeZone(start, tz, pattern);
  const endText = isValidDate(endDate) ? ` - ${formatInTimeZone(new Date(endDate), tz, pattern)}` : '';
  return `${startText}${endText} (UTC ${utcOffset(start, tz)})`;
}
