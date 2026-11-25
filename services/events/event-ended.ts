import type { EventAccess } from './event-drawer.types';
import { ACCESS_COPY } from './event-facts';

/*
 * When an event is over, for the event drawer (LAB-3426).
 */

/**
 * Whether the event has ended: its end instant has come. The instant already carries the event's time zone, so this is
 * the same moment for every viewer, and an event on its last day has not ended. An end that is not a date never ends it.
 */
export function isEventEnded(endDate: string, now: number = Date.now()): boolean {
  return now >= new Date(endDate).getTime();
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
