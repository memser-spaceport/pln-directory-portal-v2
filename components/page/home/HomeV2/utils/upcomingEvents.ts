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
 * The calendar's anchor for an event: pln-events opens an event's details from `/embed/program#<slug>`, where the slug
 * is `stringToSlug(event_name)` (pln-events `utils/helper.ts`, used by `service/events.service.ts`), computed on every
 * page and never stored. The Directory has only the pln-events id (`slugURL`), which the calendar can't open by, so
 * this is that function, ported as is.
 *
 * Not a guarantee: the slug isn't unique (four dev events are `test-event`, and recurring events repeat theirs), and
 * the calendar opens the first match. A miss shows the calendar with no event open.
 */
export function eventCalendarSlug(name: string): string {
  let str = name.replace(/^\s+|\s+$/g, '').toLowerCase();
  const from = 'àáäâèéëêìíïîòóöôùúüûñç·/_,:;';
  const to = 'aaaaeeeeiiiioooouuuunc------';
  for (let i = 0; i < from.length; i++) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }
  return str
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * The All Events calendar with this event's details open. All Events reads `?embedPath=` into its iframe, and writes it
 * there itself when someone opens an event, so this is the same link a member would share.
 *
 * By the event's pln-events id when the API sends it: unique, so it opens this event (pln-events #950 opens an event by
 * id as well as by slug). Otherwise by the slug rebuilt from the name, and without one (a name of only emoji, say) the
 * plain calendar. A leading or trailing `-` in the slug stays: pln-events keeps them too.
 */
export function eventCalendarHref({ name, calendarId }: Pick<IHomeEvent, 'name' | 'calendarId'>): string {
  const key = calendarId || eventCalendarSlug(name);
  if (!/[a-z0-9]/i.test(key)) return EVENTS_HREF;
  return `${EVENTS_HREF}?embedPath=${encodeURIComponent(`/embed/program#${key}`)}`;
}
