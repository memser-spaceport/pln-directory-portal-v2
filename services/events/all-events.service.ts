import { unstable_cache } from 'next/cache';

import { toDisplayCity } from './all-events.filters';
import { eventClock, eventEndsAt, safeTimezone, toZoneLabel } from './event-dates';
import { toEventAccess, toEventMode } from './event-drawer.mappers';
import { toFocusAreaCode } from './focus-areas';
import type { AllEventsItem, AllEventsResult, EventListItemResponse, EventListResponse } from './all-events.types';

/*
 * The All Events page's one loader: every approved event that has not ended, from `GET /v1/irl/events`, page by page.
 * Signed out on purpose: the list is the same for everyone and cached for five minutes.
 */

const api = () => process.env.DIRECTORY_API_URL;

/** The list endpoint's largest page. */
const PAGE_SIZE = 100;
/** A stop for a `total` that never comes true, so a broken answer can't loop. */
const MAX_PAGES = 50;
export const ALL_EVENTS_CACHE_TAG = 'all-events';

/** Live in client-safe modules (the IRL page's links and the cards use them too); re-exported for existing callers. */
export { toDisplayCity, toZoneLabel };

const uniqueNames = (names: (string | null | undefined)[]) =>
  Array.from(new Set(names.map((name) => name?.trim()).filter((name): name is string => !!name)));

/** One event for the page, from its row of the list endpoint. */
export function toAllEventsItem(row: EventListItemResponse): AllEventsItem {
  const timezone = safeTimezone(row.timezone);
  const allDay = row.allDay === true;
  const city = toDisplayCity(row.gathering?.city);
  const country = row.gathering?.country?.trim();
  // Null means the event hides its attendance; 0 means nobody goes yet.
  const hidden = row.goingCount === null || row.goingCount === undefined;
  // Focus area codes ("FA4") and topics are both tags; they are told apart by the code (LAB-3404).
  const tagNames = uniqueNames(row.tags ?? []);

  return {
    uid: row.uid,
    name: row.name,
    startDate: row.startDate,
    endDate: row.endDate,
    allDay,
    timezone,
    ...eventClock(row.startDate, row.endDate, timezone, allDay),
    city,
    cityKey: city ? city.toLowerCase() : null,
    place: city ? [city, country].filter(Boolean).join(', ') : null,
    mode: toEventMode(row.format),
    access: toEventAccess(row.accessOption),
    hosts: uniqueNames([row.host?.name, ...(row.coHosts ?? []).map((coHost) => coHost?.name)]),
    focusAreas: uniqueNames(tagNames.map(toFocusAreaCode)),
    tags: tagNames.filter((name) => !toFocusAreaCode(name)),
    featured: row.isFeatured === true,
    picture: row.banner || row.logo || null,
    goingCount: hidden ? null : row.goingCount,
    faces: hidden ? [] : (row.faces ?? []).slice(0, 3),
  };
}

async function fetchListPage(page: number): Promise<EventListResponse> {
  const response = await fetch(`${api()}/v1/irl/events?page=${page}&limit=${PAGE_SIZE}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Events list responded with ${response.status}`);
  const body = await response.json();
  return { ...body, items: Array.isArray(body?.items) ? body.items : [], total: Number(body?.total) || 0 };
}

/** Every page until `total` is reached. A failed page fails the load: a partial list would hide events silently. */
async function loadAllEvents(): Promise<AllEventsItem[]> {
  const rows: EventListItemResponse[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { items, total } = await fetchListPage(page);
    rows.push(...items);
    if (!items.length || rows.length >= total) break;
  }
  return rows.map(toAllEventsItem);
}

const loadAllEventsCached = unstable_cache(loadAllEvents, ['all-events-page', 'focus-areas'], {
  revalidate: 300,
  tags: [ALL_EVENTS_CACHE_TAG],
});

/** Not ended yet, soonest first. Applied on every read, so a cached list never shows a finished event. */
export function upcomingOnly(items: AllEventsItem[], now: Date = new Date()): AllEventsItem[] {
  return items
    .filter((item) => eventEndsAt(item.endDate, item.timezone, item.allDay).getTime() > now.getTime())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}

/** Every upcoming event for `/events/all`, or `{ ok: false }` when the list itself couldn't load. */
export async function getAllEventsPageEvents(): Promise<AllEventsResult> {
  try {
    return { ok: true, items: upcomingOnly(await loadAllEventsCached()) };
  } catch (error) {
    console.error('[all-events] failed to load upcoming events', error);
    return { ok: false };
  }
}

/** Most specific first: the location picker can store a metro area, region or country without a city. */
const PLACE_FIELDS = ['city', 'metroArea', 'region', 'country'] as const;

/**
 * The signed-in member's profile place, for Near you: the most specific of `location.city`, `metroArea`, `region` and
 * `country` (about one member in nine has a location with no city, e.g. `{ metroArea: 'Kyiv', country: 'Ukraine' }`).
 * `null` only when the profile has no location at all (the Add location row); `undefined` when it couldn't be read
 * (then the page shows neither Near you nor the Add location row). Near you matches that place against event cities:
 * a city-state saved as a country ("Singapore") matches; a region or a larger country matches nothing, so Near you
 * stays hidden without asking a member who has a location to add one.
 */
export async function getMemberProfileCity(memberUid: string, authToken: string): Promise<string | null | undefined> {
  try {
    const response = await fetch(`${api()}/v1/members/${encodeURIComponent(memberUid)}`, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!response.ok) return undefined;
    const member = await response.json();
    const location = member?.location ?? {};
    for (const field of PLACE_FIELDS) {
      const value = location[field];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return null;
  } catch {
    return undefined;
  }
}
