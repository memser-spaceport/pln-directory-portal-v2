import type { EventAccess, EventMode } from './event-drawer.types';

/*
 * How an event's place and access read wherever it shows (LAB-3247): the All Events cards, the Calendar and the event
 * drawer. One wording, so an event never reads "Hybrid" in one place and "also online" in another.
 */

/** Where the event is: "Online", the place, or the place "· also online" for a hybrid event. Null with neither. */
export function eventPlace(
  mode: EventMode | null | undefined,
  where: string | null | undefined,
): { text: string; online: boolean } | null {
  if (mode === 'Virtual') return { text: 'Online', online: true };
  if (mode === 'Hybrid')
    return where ? { text: `${where} · also online`, online: false } : { text: 'Online', online: true };
  return where ? { text: where, online: false } : null;
}

/**
 * How you get in, as words: the short label, and what it means for the guest (`event-drawer-redesign/AccessIcon`).
 * The events service's `OPEN` is one line and never "Free" (LAB-3407): it means "open to all" as much as "free", so it
 * does not say that an event costs nothing.
 */
export const ACCESS_COPY: Record<EventAccess, { main: string; sub: string | null }> = {
  'INVITE ONLY': { main: 'Invite only', sub: 'The hosts approve each guest' },
  PAID: { main: 'Paid', sub: "Tickets on the host's site" },
  'FREE w/ RSVP': { main: 'RSVP to save your spot', sub: null },
};
