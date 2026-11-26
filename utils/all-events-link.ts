import { toDisplayCity } from '@/services/events/all-events.filters';
import { encodeFilterValues } from '@/services/filters';
import { SHOW_EVENT_DRAWER } from '@/utils/event-drawer';
import { SHOW_EVENTS_PAGE_V2 } from '@/utils/events-page';

export const ALL_EVENTS_PATH = '/events/all';

/** Where a link goes, and whether it leaves LabOS (then it opens in a new tab). */
export interface EventsLink {
  href: string;
  newTab: boolean;
}

/** The native All Events page is on: `/events/all` renders it only with both flags (see `app/events/all/page.tsx`). */
export function isAllEventsPageOn(): boolean {
  return SHOW_EVENTS_PAGE_V2 && SHOW_EVENT_DRAWER;
}

/**
 * A gathering's schedule (LAB-3337). A gathering's own schedule (`additionalInfo.schedule_url`, e.g. the Lab Week
 * site) always wins, in a new tab. Otherwise, with the All Events page on, `/events/all` scoped to the gathering's
 * city, in the same tab: "london" → `/events/all?city=London`; a gathering with no city ("Others") → `/events/all`.
 * With it off, `legacyHref`, the events app's calendar, in a new tab as before.
 */
export function gatheringScheduleLink(
  gathering: string | null | undefined,
  legacyHref: string,
  ownSchedule?: string | null,
): EventsLink {
  const own = ownSchedule?.trim();
  if (own) return { href: own, newTab: true };
  if (!isAllEventsPageOn()) return { href: legacyHref, newTab: true };
  const city = toDisplayCity(gathering);
  return {
    href: city ? `${ALL_EVENTS_PATH}?city=${encodeURIComponent(encodeFilterValues([city]))}` : ALL_EVENTS_PATH,
    newTab: false,
  };
}

/**
 * One event, e.g. a global search result (LAB-3341): with the All Events page on, `/events/all?event=<uid>` in the
 * same tab, which opens its drawer; LabOS owns events, so the old events app is no target. With it off, `legacyHref`
 * (the search index's events-app link) in a new tab as before. No uid and no legacy link: no link.
 */
export function eventLink(uid: string | null | undefined, legacyHref?: string | null): EventsLink | null {
  if (isAllEventsPageOn() && uid) return { href: `${ALL_EVENTS_PATH}?event=${encodeURIComponent(uid)}`, newTab: false };
  const legacy = legacyHref?.trim();
  return legacy ? { href: legacy, newTab: true } : null;
}

/** Every event (the IRL page's "View All Events" card): `/events/all` when it is on, else `legacyHref` in a new tab. */
export function allEventsLink(legacyHref: string): EventsLink {
  return isAllEventsPageOn() ? { href: ALL_EVENTS_PATH, newTab: false } : { href: legacyHref, newTab: true };
}
