import type { IHomeEvent } from '@/types/home.types';

/** The rail lists events that start in the next 30 days, at most three, soonest first. */
export const HOME_EVENTS_DAYS = 30;
export const HOME_EVENTS_LIMIT = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The rail's events, trimmed on our side as well: until the backend's `days` / `limit` / `sort=soonest` params are
 * deployed (LAB-3071), the endpoint returns every upcoming event, newest first.
 */
export function selectUpcomingEvents(
  events: IHomeEvent[],
  now: number,
  days: number = HOME_EVENTS_DAYS,
  limit: number = HOME_EVENTS_LIMIT,
): IHomeEvent[] {
  const until = now + days * DAY_MS;
  return events
    .filter((event) => {
      const start = Date.parse(event.startDate);
      return Number.isFinite(start) && start <= until;
    })
    .sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate))
    .slice(0, limit);
}

const MONTH = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' });

/** "NOV" for the date tile. UTC, so the server and the browser draw the same day. */
export const eventMonth = (iso: string) => MONTH.format(new Date(iso)).toUpperCase();

/** The day of the month for the date tile (UTC). */
export const eventDay = (iso: string) => new Date(iso).getUTCDate();

/** "Nov 3–7" (or "Nov 30–Dec 2") when an event runs over several days; null for a one-day event. */
export function eventRange(startIso: string, endIso: string): string | null {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

  const sameDay =
    start.getUTCFullYear() === end.getUTCFullYear() &&
    start.getUTCMonth() === end.getUTCMonth() &&
    start.getUTCDate() === end.getUTCDate();
  if (sameDay || end < start) return null;

  const startLabel = `${MONTH.format(start)} ${start.getUTCDate()}`;
  const endLabel =
    start.getUTCMonth() === end.getUTCMonth() && start.getUTCFullYear() === end.getUTCFullYear()
      ? `${end.getUTCDate()}`
      : `${MONTH.format(end)} ${end.getUTCDate()}`;
  return `${startLabel}–${endLabel}`;
}
