import { unstable_cache } from 'next/cache';

import { sortPast } from './all-events.filters';
import { ALL_EVENTS_CACHE_TAG, mapLimit } from './all-events.service';
import type { AllEventsItem } from './all-events.types';
import { isEventEnded } from './event-ended';
import { toPastEventItem } from './past-events.mapper';

/*
 * Past events for the All Events page (LAB-3418), behind `GET /api/events/past`: every event of `GET /v1/irl/events`,
 * page by page, then those that have started or soon will. The page tells which have ended by its own clock. Signed out
 * on purpose: the list is the same for everyone.
 */

/** The list endpoint's largest page. */
export const PAST_EVENTS_PAGE_SIZE = 100;
/** More pages than this fail the load. 2,000 mapped events stay under Next's 2 MB limit for one cached value. */
export const PAST_EVENTS_MAX_PAGES = 20;
/** List calls in flight at once. */
const PAGE_CONCURRENCY = 6;
/** A call that takes longer fails the load: everyone who asks meanwhile waits for it. */
const PAGE_TIMEOUT_MS = 10_000;
/** How long before its start an event joins the list, so a page that has it can tell its end. */
const AHEAD_MS = 24 * 60 * 60_000;

/**
 * Without `from` the endpoint sends only events that have not ended; from the epoch it sends every event. No `to`: the
 * address holds no clock, and the cached copy already has the events that end while it is served.
 */
async function fetchPage(page: number): Promise<{ total: number; items: unknown[] }> {
  const query = new URLSearchParams({
    from: '1970-01-01',
    page: String(page),
    limit: String(PAST_EVENTS_PAGE_SIZE),
  });
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/irl/events?${query.toString()}`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(PAGE_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Events list page ${page} responded with ${response.status}`);
  const body = await response.json();
  const items: unknown = body?.items;
  const total: unknown = body?.total;
  if (!Array.isArray(items) || typeof total !== 'number' || !Number.isInteger(total) || total < items.length) {
    throw new Error(`Events list page ${page} has an unexpected shape`);
  }
  if (!items.length && (page - 1) * PAST_EVENTS_PAGE_SIZE < total) {
    throw new Error(`Events list page ${page} is empty before its total of ${total}`);
  }
  return { total, items };
}

/** Every page, or an error: a partial list would hide events silently. */
async function loadListedEvents(): Promise<AllEventsItem[]> {
  const first = await fetchPage(1);
  const pageCount = Math.ceil(first.total / PAST_EVENTS_PAGE_SIZE);
  if (pageCount > PAST_EVENTS_MAX_PAGES)
    throw new Error(`The events list is longer than ${PAST_EVENTS_MAX_PAGES} pages`);
  const rest = await mapLimit(
    Array.from({ length: Math.max(0, pageCount - 1) }, (_, i) => i + 2),
    PAGE_CONCURRENCY,
    fetchPage,
  );

  const byUid = new Map<string, AllEventsItem>();
  [first, ...rest]
    .flatMap((page) => page.items)
    .forEach((row) => {
      const item = toPastEventItem(row);
      // An event can move to another page between two calls; it counts once.
      if (item && !byUid.has(item.uid)) byUid.set(item.uid, item);
    });
  return Array.from(byUid.values());
}

let inFlight: Promise<AllEventsItem[]> | null = null;

/** One load at a time in this process: requests that come while it runs share it, and neither outcome is kept. */
function loadListedEventsOnce(): Promise<AllEventsItem[]> {
  inFlight ??= loadListedEvents().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

const loadListedEventsCached = unstable_cache(loadListedEventsOnce, ['past-events-page'], {
  revalidate: 300,
  tags: [ALL_EVENTS_CACHE_TAG],
});

/**
 * The events that have started or start within a day, newest first: those that have ended, and those that may while a
 * page keeps this list. Read against the clock on every call, so an old cached copy has no gap.
 */
export async function getStartedEvents(now: number = Date.now()): Promise<AllEventsItem[]> {
  const items = await loadListedEventsCached();
  return sortPast(
    items.filter((item) => new Date(item.startDate).getTime() <= now + AHEAD_MS || isEventEnded(item.endDate, now)),
  );
}
