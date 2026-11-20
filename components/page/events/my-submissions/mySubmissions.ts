import { eventClock, eventEndsAt, formatEventDateLine, safeTimezone } from '@/services/events/event-dates';
import type { MyEventResponse } from '@/services/events/event-submission.types';

export type SubmissionsPeriod = 'upcoming' | 'past';

export interface SubmissionsMonth {
  /** "2026-12": the start month in the event's time zone. */
  key: string;
  /** "DEC 2026". */
  label: string;
  events: MyEventResponse[];
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function startTime(event: MyEventResponse): number {
  const time = new Date(event.startDate).getTime();
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
}

/** "2026-12" for the event's start in its own time zone; empty when the start is not a date. */
function startMonthKey(event: MyEventResponse): string {
  if (Number.isNaN(new Date(event.startDate).getTime())) return '';
  const { startDay } = eventClock(event.startDate, event.endDate, safeTimezone(event.timezone), !!event.allDay);
  return startDay.slice(0, 7);
}

function monthLabel(key: string): string {
  const [year, month] = key.split('-');
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

/** An event is upcoming while its end is not in the past. An event with no readable end counts as upcoming. */
export function isUpcoming(event: MyEventResponse, now: Date): boolean {
  const end = eventEndsAt(event.endDate || event.startDate, safeTimezone(event.timezone), !!event.allDay).getTime();
  return Number.isNaN(end) || end >= now.getTime();
}

/** The events of one period whose name holds `query`, ignoring case. An empty query keeps them all. */
export function filterSubmissions(
  events: MyEventResponse[],
  period: SubmissionsPeriod,
  query: string,
  now: Date,
): MyEventResponse[] {
  const text = query.trim().toLowerCase();
  return events.filter((event) => {
    if (isUpcoming(event, now) !== (period === 'upcoming')) return false;
    return !text || (event.name ?? '').toLowerCase().includes(text);
  });
}

/** Events under their start month, earliest month first, and earliest start first inside a month. */
export function groupByMonth(events: MyEventResponse[]): SubmissionsMonth[] {
  const months = new Map<string, MyEventResponse[]>();
  [...events]
    .sort((a, b) => startTime(a) - startTime(b))
    .forEach((event) => {
      const key = startMonthKey(event);
      months.set(key, [...(months.get(key) ?? []), event]);
    });

  return [...months.entries()]
    .sort(([a], [b]) => (a === '' ? 1 : b === '' ? -1 : a.localeCompare(b)))
    .map(([key, monthEvents]) => ({ key, label: key ? monthLabel(key) : '', events: monthEvents }));
}

/** The row's date line in the event's time zone. An all-day event reads as a date or a date range only. */
export function submissionDates(event: MyEventResponse): string {
  return formatEventDateLine(event.startDate, event.endDate, safeTimezone(event.timezone), !!event.allDay);
}

/** "03/12/2026, 14:05" in the viewer's time zone, from `updatedAt` or else `createdAt`; null when neither is a date. */
export function lastModified(event: MyEventResponse): string | null {
  const value = event.updatedAt || event.createdAt;
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}
