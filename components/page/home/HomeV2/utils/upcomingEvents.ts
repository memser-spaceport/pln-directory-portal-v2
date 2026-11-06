import type { IHomeEvent } from '@/types/home.types';
import { EVENTS_HREF } from '../constants';

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

/**
 * The calendar's anchor for an event: pln-events opens an event's details from `/embed/program#<slug>`. The Directory
 * doesn't store that slug (its `slugURL` is the pln-events id, and the calendar can't open an event by id), so this
 * rebuilds it from the name the way pln-events makes it: lower case, accents dropped, spaces and colons to `-`, every
 * other character that isn't a letter, digit or `-` dropped, runs of `-` collapsed. It matched all 225 events in the
 * dev calendar (2026-11-06).
 *
 * Not a guarantee: pln-events slugs aren't unique (four dev events are `test-event`, and recurring events repeat theirs),
 * and the calendar opens the first match. A miss shows the calendar with no event open.
 */
export function eventCalendarSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\s:]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}

/**
 * The All Events calendar with this event's details open. All Events reads `?embedPath=` into its iframe, and writes it
 * there itself when someone opens an event, so this is the same link a member would share. Without a slug (a name of
 * only emoji, say) it is the plain calendar. A leading or trailing `-` stays: pln-events keeps them too.
 */
export function eventCalendarHref(name: string): string {
  const slug = eventCalendarSlug(name);
  if (!/[a-z0-9]/.test(slug)) return EVENTS_HREF;
  return `${EVENTS_HREF}?embedPath=${encodeURIComponent(`/embed/program#${slug}`)}`;
}
