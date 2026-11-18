import { unstable_cache } from 'next/cache';
import { formatInTimeZone } from 'date-fns-tz';

import { toEventDetail } from './event-drawer.mappers';
import type { EventDetailResponse } from './event-drawer.types';
import type { UpcomingEvent } from './hooks/useUpcomingEvents';
import type { AllEventsItem, AllEventsResult } from './all-events.types';

/*
 * The All Events page's one loader (LAB-3247, design D2). Phase 1 uses the endpoints that exist: every upcoming event
 * from `/v1/irl/events/upcoming`, then each one's `/v1/irl/events/:uid` for its time zone, mode, hosts and faces. There
 * are about ten upcoming events, so N detail calls are cheap; the backend list endpoint of phase 2 (LAB-3281)
 * replaces them. Signed out on purpose: the list is the same for everyone and cached for five minutes.
 */

const api = () => process.env.DIRECTORY_API_URL;

/** Detail calls in flight at once. */
const DETAIL_CONCURRENCY = 6;
/** Past this many events the per-event calls are worth a warning; the phase 2 endpoint is the fix. */
const MANY_EVENTS = 60;
export const ALL_EVENTS_CACHE_TAG = 'all-events';

/** "Lisbon, Portugal" → "Lisbon"; "new york" → "New York"; "Others" (the events app's catch-all) → null. */
export function toDisplayCity(raw: string | null | undefined): string | null {
  const head = (raw ?? '').split(',')[0]?.trim() ?? '';
  if (!head || head.toLowerCase() === 'others') return null;
  return head === head.toLowerCase() ? head.replace(/(^|[\s-])(\p{L})/gu, (m) => m.toUpperCase()) : head;
}

/** "+05:30" → "UTC+5:30", "-03:00" → "UTC−3", "+00:00" → "UTC+0". */
export function toZoneLabel(date: Date, timezone: string): string {
  const match = /^([+-])(\d{2}):(\d{2})$/.exec(formatInTimeZone(date, timezone, 'xxx'));
  if (!match) return 'UTC+0';
  const [, sign, hours, minutes] = match;
  return `UTC${sign === '-' ? '−' : '+'}${Number(hours)}${minutes === '00' ? '' : `:${minutes}`}`;
}

/** One event for the page, from its `/upcoming` row and its detail (null when the detail call failed). */
export function toAllEventsItem(row: UpcomingEvent, raw: EventDetailResponse | null): AllEventsItem {
  const detail = raw ? toEventDetail(raw) : null;
  const timezone = detail?.timezone ?? 'UTC';
  const start = new Date(row.startDate);
  const end = new Date(row.endDate);
  const city = toDisplayCity(raw?.location?.city || raw?.location?.location || row.location);
  // `/upcoming` sends null for an event that hides its attendance; the detail would say 0, which isn't the same.
  const hidden = row.goingCount === null;

  return {
    uid: row.uid,
    name: row.name,
    startDate: row.startDate,
    endDate: row.endDate,
    timezone,
    startDay: formatInTimeZone(start, timezone, 'yyyy-MM-dd'),
    endDay: formatInTimeZone(end, timezone, 'yyyy-MM-dd'),
    startTime: formatInTimeZone(start, timezone, 'h:mm a'),
    zone: toZoneLabel(start, timezone),
    city,
    cityKey: city ? city.toLowerCase() : null,
    place: detail?.address ?? null,
    mode: detail?.mode ?? null,
    access: detail?.access ?? null,
    hosts: detail?.hosts ?? [],
    tags: detail?.tags.map((t) => t.name) ?? [],
    picture: raw?.banner || raw?.logo || row.logo || null,
    goingCount: hidden ? null : (raw?.goingCount ?? row.goingCount ?? null),
    faces: hidden ? [] : (raw?.faces ?? []).slice(0, 3),
  };
}

async function fetchUpcomingRows(): Promise<UpcomingEvent[]> {
  const response = await fetch(`${api()}/v1/irl/events/upcoming`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Upcoming events responded with ${response.status}`);
  const body = await response.json();
  return Array.isArray(body) ? body : [];
}

/** One event's detail, or null on any failure: one bad event keeps its list fields and never fails the page. */
async function fetchDetail(uid: string): Promise<EventDetailResponse | null> {
  try {
    const response = await fetch(`${api()}/v1/irl/events/${encodeURIComponent(uid)}`, { cache: 'no-store' });
    return response.ok ? ((await response.json()) as EventDetailResponse) : null;
  } catch {
    return null;
  }
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      out[index] = await fn(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

async function loadAllEvents(): Promise<AllEventsItem[]> {
  const rows = await fetchUpcomingRows();
  if (rows.length > MANY_EVENTS) {
    console.warn(`[all-events] ${rows.length} upcoming events: one detail call each. Phase 2 needs the list endpoint.`);
  }
  const details = await mapLimit(rows, DETAIL_CONCURRENCY, (row) => fetchDetail(row.uid));
  return rows.map((row, i) => toAllEventsItem(row, details[i]));
}

const loadAllEventsCached = unstable_cache(loadAllEvents, ['all-events-page'], {
  revalidate: 300,
  tags: [ALL_EVENTS_CACHE_TAG],
});

/** Not ended yet, soonest first. Applied on every read, so a cached list never shows a finished event. */
export function upcomingOnly(items: AllEventsItem[], now: Date = new Date()): AllEventsItem[] {
  return items
    .filter((item) => new Date(item.endDate).getTime() > now.getTime())
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

/**
 * The signed-in member's profile city, for Near you: the trimmed `location.city`, `null` when their profile has none,
 * `undefined` when it couldn't be read (then the page shows neither Near you nor the Add location row).
 */
export async function getMemberProfileCity(memberUid: string, authToken: string): Promise<string | null | undefined> {
  try {
    const response = await fetch(`${api()}/v1/members/${encodeURIComponent(memberUid)}`, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!response.ok) return undefined;
    const member = await response.json();
    const city = member?.location?.city;
    return typeof city === 'string' && city.trim() ? city.trim() : null;
  } catch {
    return undefined;
  }
}
