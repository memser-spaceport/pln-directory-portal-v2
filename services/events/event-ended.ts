import { eventEndsAt } from './event-dates';
import type { EventAccess } from './event-drawer.types';
import { ACCESS_COPY } from './event-facts';

/*
 * When an event is over, for the event drawer (LAB-3426).
 */

/**
 * When the event ends, in epoch ms; NaN when its end is not a date. A timed event's end is an instant that already
 * carries its time zone. An all-day event's end is a day (LAB-3339): it runs to the end of that day in its time zone.
 */
export function eventEndMs(endDate: string, allDay = false, timezone = 'UTC'): number {
  if (!allDay) return new Date(endDate).getTime();
  try {
    return eventEndsAt(endDate, timezone, true).getTime();
  } catch {
    return NaN;
  }
}

/**
 * Whether the event has ended: its end has come (`eventEndMs`). The same moment for every viewer, and an event on its
 * last day has not ended. An end that is missing or not a date never ends it (`new Date(null)` would be 1970).
 */
export function isEventEnded(
  endDate: string | null | undefined,
  now: number = Date.now(),
  allDay = false,
  timezone = 'UTC',
): boolean {
  return !!endDate && now >= eventEndMs(endDate, allDay, timezone);
}

/**
 * The drawer's access row once the event has ended: what the event was, without the part that asks the reader to come.
 * Null leaves the row out ("RSVP to save your spot" is nothing but the ask).
 */
export const ENDED_ACCESS_COPY: Record<EventAccess, { main: string; sub: string | null } | null> = {
  'INVITE ONLY': ACCESS_COPY['INVITE ONLY'],
  PAID: { main: ACCESS_COPY.PAID.main, sub: null },
  'FREE w/ RSVP': null,
};
