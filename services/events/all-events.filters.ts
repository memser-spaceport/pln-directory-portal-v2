import { decodeFilterValues } from '@/services/filters';

import type { AllEventsItem } from './all-events.types';
import type { EventMode } from './event-drawer.types';
import { ACCESS_COPY } from './event-facts';
import { focusAreaName } from './focus-areas';

/*
 * The All Events page's pure views over the loaded events (LAB-3247, design D4): filtering, day groups, cities and
 * Near you. Everything happens in the browser over one array, so a filter never makes a request.
 */

/**
 * The rail's Mode labels, which are also what the `mode` param stores. An online event is "Online", the word its card
 * and drawer use (LAB-3370; the events service calls it Virtual).
 */
export const MODE_LABEL: Record<EventMode, string> = { 'In-Person': 'In person', Virtual: 'Online', Hybrid: 'Hybrid' };

/** The params that count as applied filters. `view`, `cal` and `event` are page state, not filters. */
export const FILTER_PARAMS = ['search', 'going', 'mode', 'access', 'focus', 'topic', 'city', 'host'] as const;
export type FilterParam = (typeof FILTER_PARAMS)[number];
export const isFilterParam = (key: string): key is FilterParam => (FILTER_PARAMS as readonly string[]).includes(key);

/** The embed page's address (LAB-3352). */
export const EVENTS_EMBED_PATH = '/events/embed';

/**
 * What an embed link carries (LAB-3352): the view, the calendar mode and every filter but "Events I'm going to", which
 * needs a signed-in member. Never the open event. In the page's own order, so a copied link reads like the address.
 */
export const EMBED_PARAMS = ['view', 'cal', ...FILTER_PARAMS.filter((key) => key !== 'going')] as const;

/**
 * The embed link's one choice that isn't the page's state (LAB-3392): with `details=labos` an event opens on LabOS in
 * a new tab; without it, its details open in the embed's own drawer.
 */
export const EMBED_DETAILS_PARAM = 'details';
export const EMBED_DETAILS_ON_LABOS = 'labos';

/** The embed link with the host's choice to open events on LabOS (LAB-3392); unchanged for the default. */
export function withEmbedDetails(link: string, onLabOs: boolean): string {
  if (!onLabOs) return link;
  return `${link}${link.includes('?') ? '&' : '?'}${EMBED_DETAILS_PARAM}=${EMBED_DETAILS_ON_LABOS}`;
}

/** An event on the All Events page, its drawer open: where the embed sends a reader to LabOS. */
export const allEventsEventHref = (uid: string) => `/events/all?event=${encodeURIComponent(uid)}`;

/** The query of the embed link for the page's address, without a leading `?`; empty for the plain List. */
export function embedQuery(params: URLSearchParams): string {
  const next = new URLSearchParams();
  EMBED_PARAMS.forEach((key) => {
    const value = params.get(key);
    if (value) next.set(key, value);
  });
  return next.toString();
}

/** A filter param's values as analytics records them: the decoded list, `['true']` for going, the search text. */
export function filterValues(key: FilterParam, value: string | null | undefined): string[] {
  if (isFacetKey(key)) return decodeFilterValues(value ?? undefined);
  return value ? [value] : [];
}

/**
 * The rail's lists of values, in the prototype's order. Focus area holds the events portal's focus area codes and Topic
 * every other tag (LAB-3404). Access, Focus area, Topic and Host come from the event's details, which the events service fills by its details sync; an event without
 * them simply has no value there.
 */
export const FACET_KEYS = ['mode', 'access', 'focus', 'topic', 'city', 'host'] as const;
export type FacetKey = (typeof FACET_KEYS)[number];
const isFacetKey = (key: string): key is FacetKey => (FACET_KEYS as readonly string[]).includes(key);

export type AllEventsFilters = { search: string; going: boolean } & Record<FacetKey, string[]>;

export function readFilters(params: URLSearchParams): AllEventsFilters {
  return {
    search: params.get('search')?.trim() ?? '',
    going: params.get('going') === 'true',
    mode: decodeFilterValues(params.get('mode')),
    access: decodeFilterValues(params.get('access')),
    focus: decodeFilterValues(params.get('focus')),
    topic: decodeFilterValues(params.get('topic')),
    city: decodeFilterValues(params.get('city')),
    host: decodeFilterValues(params.get('host')),
  };
}

/** One per applied value, as the Filters button and the phone pill count them. */
export function countAppliedFilters(params: URLSearchParams): number {
  const f = readFilters(params);
  return (f.search ? 1 : 0) + (f.going ? 1 : 0) + FACET_KEYS.reduce((n, key) => n + f[key].length, 0);
}

/**
 * The values an event has for a facet: the words its card and drawer use ("Invite only", "In person"), except that a
 * focus area is its code. `facetLabel` gives what a reader sees.
 */
export function facetValues(item: AllEventsItem, key: FacetKey): string[] {
  switch (key) {
    case 'mode':
      return item.mode ? [MODE_LABEL[item.mode]] : [];
    case 'access':
      return item.access ? [ACCESS_COPY[item.access].main] : [];
    case 'focus':
      return item.focusAreas;
    case 'topic':
      return item.tags;
    case 'host':
      return item.hosts;
    case 'city':
      return item.city ? [item.city] : [];
  }
}

/** What a reader sees for a facet's value: a focus area's name for its code (LAB-3404), any other value as it is. */
export const facetLabel = (key: FacetKey, value: string) => (key === 'focus' ? focusAreaName(value) : value);

/** A facet's options with how many events carry each, most first. */
export function facetOptions(items: AllEventsItem[], key: FacetKey) {
  const counts = new Map<string, number>();
  items.forEach((item) => facetValues(item, key).forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1)));
  return Array.from(counts, ([value, count]) => ({ value, count, disabled: false })).sort(
    (a, b) => b.count - a.count || facetLabel(key, a.value).localeCompare(facetLabel(key, b.value)),
  );
}

function matchesSearch(item: AllEventsItem, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return [item.name, item.city ?? '', ...item.hosts, ...item.focusAreas.map(focusAreaName), ...item.tags].some((v) =>
    v.toLowerCase().includes(q),
  );
}

function matchesFacet(item: AllEventsItem, key: FacetKey, selected: string[]): boolean {
  if (!selected.length) return true;
  const wanted = selected.map((v) => v.toLowerCase());
  return facetValues(item, key).some((v) => wanted.includes(v.toLowerCase()));
}

/** Values within one filter are OR; filters together are AND (the events app's rule). */
export function filterEvents(items: AllEventsItem[], f: AllEventsFilters, goingUids: Set<string>): AllEventsItem[] {
  return items.filter(
    (item) =>
      (!f.going || goingUids.has(item.uid)) &&
      matchesSearch(item, f.search) &&
      FACET_KEYS.every((key) => matchesFacet(item, key, f[key])),
  );
}

/* ---------- Days ---------- */

/** The viewer's local day, "2026-12-03". */
export function localIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Noon on that day, so a calendar day never slips across a DST change. */
/** An ISO day at local noon, so day arithmetic never trips over a daylight-saving change. */
export const atNoon = (isoDay: string) => new Date(`${isoDay}T12:00:00`);

/** "Dec 3". */
export const shortDate = (isoDay: string) =>
  atNoon(isoDay).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

/** Where an event sits in the list: its first day, or today if it is already under way. */
export function listDay(item: AllEventsItem, todayIso: string): string {
  return item.startDay < todayIso ? todayIso : item.startDay;
}

/** Events grouped by their list day, soonest first; within a day, earliest start first. */
export function groupByDay(items: AllEventsItem[], todayIso: string): { day: string; events: AllEventsItem[] }[] {
  const sorted = [...items].sort(
    (a, b) =>
      listDay(a, todayIso).localeCompare(listDay(b, todayIso)) ||
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );
  return sorted.reduce<{ day: string; events: AllEventsItem[] }[]>((days, item) => {
    const day = listDay(item, todayIso);
    const last = days[days.length - 1];
    if (last?.day === day) last.events.push(item);
    else days.push({ day, events: [item] });
    return days;
  }, []);
}

/** "Day 2 of 5" for a multi-day event on a given day; empty for a one-day event. */
export function dayOfSpan(item: AllEventsItem, isoDay: string): string {
  if (item.startDay === item.endDay) return '';
  const dayMs = 86_400_000;
  const total = Math.round((atNoon(item.endDay).getTime() - atNoon(item.startDay).getTime()) / dayMs) + 1;
  const n = Math.round((atNoon(isoDay).getTime() - atNoon(item.startDay).getTime()) / dayMs) + 1;
  return `Day ${n} of ${total}`;
}

/** Luma's date column: "Today" / "Tomorrow" / "Dec 3", with the weekday under it. */
export function dayHeading(isoDay: string, todayIso: string): { label: string; weekday: string } {
  const d = atNoon(isoDay);
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
  const tomorrow = atNoon(todayIso);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (isoDay === todayIso) return { label: 'Today', weekday };
  if (isoDay === localIso(tomorrow)) return { label: 'Tomorrow', weekday };
  return { label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), weekday };
}

/** "Dec 1 – 5", "Nov 30 – Dec 2", "Jan 14". */
export function spanLabel(startDay: string, endDay: string): string {
  const s = atNoon(startDay);
  const e = atNoon(endDay);
  if (startDay === endDay) return shortDate(startDay);
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth())
    return `${shortDate(startDay)} – ${e.getDate()}`;
  return `${shortDate(startDay)} – ${shortDate(endDay)}`;
}

/** A Near you tile's when: "Thu, Nov 19 · 6:00 PM"; a multi-day event reads its span ("Tue, Dec 1 – 5"). */
export function whenLine(item: AllEventsItem, todayIso: string): string {
  const weekdayDate = (iso: string) =>
    atNoon(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  if (item.startDay !== item.endDay) {
    if (item.startDay < todayIso) return `Today · ${dayOfSpan(item, todayIso)}`;
    return `${weekdayDate(item.startDay).split(',')[0]}, ${spanLabel(item.startDay, item.endDay)}`;
  }
  return [item.startDay === todayIso ? 'Today' : weekdayDate(item.startDay), item.startTime].join(' · ');
}

/* ---------- Cities ---------- */

/** The Browse by city band shows this many; "All N cities" opens the rest. */
export const MAIN_CITY_COUNT = 5;

export interface CitySummary {
  city: string;
  eventCount: number;
  startDay: string;
  endDay: string;
  /** "UTC+0", from the city's first event. */
  zone: string;
}

/** Every city with something coming up, most events first, then the one whose events start first. */
export function topCities(items: AllEventsItem[]): CitySummary[] {
  const byCity = new Map<string, AllEventsItem[]>();
  items.forEach((item) => {
    if (item.city) byCity.set(item.city, [...(byCity.get(item.city) ?? []), item]);
  });
  return Array.from(byCity, ([city, list]) => {
    const first = [...list].sort((a, b) => a.startDay.localeCompare(b.startDay))[0];
    return {
      city,
      eventCount: list.length,
      startDay: first.startDay,
      endDay: list.reduce((m, e) => (e.endDay > m ? e.endDay : m), first.endDay),
      zone: first.zone,
    };
  }).sort(
    (a, b) => b.eventCount - a.eventCount || a.startDay.localeCompare(b.startDay) || a.city.localeCompare(b.city),
  );
}

/**
 * The city the All Events page shows for a gathering name, and filters on:
 * "Lisbon, Portugal" → "Lisbon"; "new york" → "New York"; "Others" (the events app's catch-all) → null.
 */
export function toDisplayCity(raw: string | null | undefined): string | null {
  const head = (raw ?? '').split(',')[0]?.trim() ?? '';
  if (!head || head.toLowerCase() === 'others') return null;
  return head === head.toLowerCase() ? head.replace(/(^|[\s-])(\p{L})/gu, (m) => m.toUpperCase()) : head;
}

/** "Lisbon", "lisbon, portugal" and " LISBON " all mean the same city. */
export function cityKeyOf(text: string | null | undefined): string | null {
  const head = (text ?? '').split(',')[0]?.trim().toLowerCase();
  return head || null;
}

/**
 * Near you: up to 3 upcoming in-person or hybrid events in the member's profile city, soonest first, and the city as
 * the events name it. Null when nothing matches, so the section doesn't show.
 */
export function nearYou(
  items: AllEventsItem[],
  memberCity: string | null | undefined,
): { city: string; events: AllEventsItem[] } | null {
  const key = cityKeyOf(memberCity);
  if (!key) return null;
  const events = items
    .filter((item) => item.cityKey === key && item.mode !== 'Virtual')
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 3);
  return events.length ? { city: events[0].city as string, events } : null;
}
