import { CAL_EVENTS, DETAILS, THUMBS, eventByUid, type CalEvent } from '../event-drawer-redesign/mocks';

/**
 * The page reads event-drawer-redesign's event list, so every row opens the
 * same drawer with the same facts. Nothing new is invented here: only views
 * over that list (day groups, cities, filters, a day schedule).
 */
export { CAL_EVENTS, DETAILS, THUMBS, eventByUid };
export type { CalEvent };

/**
 * The events app's Filters rail (/events/all), kept in full and moved to the directory's left
 * rail: Show featured events, Modes, Access Types, Focus Areas, Gatherings, Hosts. Plus "Going",
 * the page's own view of your plans. Values are the labels the rail shows (GenericCheckboxList
 * stores what it displays), and options come off the events, so none is ever empty.
 *
 * 2026-11-17 (Nov 16 standup): IRL gatherings are being hidden, so the app's "Gatherings"
 * filter is kept as **City**: the same question ("which place?"), answered by every event's
 * city rather than only the ones inside a gathering. The "Browse by city" tiles write the same
 * `city` param, so a tile and the rail are one selection.
 */
export type FacetKey = 'mode' | 'access' | 'focus' | 'city' | 'host';

export interface EventFilters {
  going: boolean;
  featured: boolean;
  mode: string[];
  access: string[];
  focus: string[];
  city: string[];
  host: string[];
}

/** Mock: the events app marks a few events featured; there is no flag in the drawer mocks. */
export const FEATURED = new Set(['labweek-lisbon', 'fil-dev-summit', 'dai-summit-bangalore']);

const MODE_LABEL: Record<string, string> = { 'In-Person': 'In person', Virtual: 'Virtual', Hybrid: 'Hybrid' };
const ACCESS_LABEL: Record<string, string> = {
  'FREE w/ RSVP': 'Free with RSVP',
  PAID: 'Paid',
  'INVITE ONLY': 'Invite only',
};

/** The labels an event has for each facet. */
export function facetValues(event: CalEvent, key: FacetKey): string[] {
  const d = DETAILS[event.uid];
  if (key === 'mode') return [MODE_LABEL[d.mode]];
  if (key === 'access') return [ACCESS_LABEL[d.access]];
  if (key === 'focus') return d.tags.map((x) => x.name);
  if (key === 'city') return event.city ? [event.city] : [];
  return d.hosts;
}

export const FACETS: { key: FacetKey; title: string; label?: string; placeholder?: string; searchable: boolean }[] = [
  { key: 'mode', title: 'Mode', searchable: false },
  { key: 'access', title: 'Access type', searchable: false },
  {
    key: 'focus',
    title: 'Focus area',
    label: 'Search or select a focus area',
    placeholder: 'E.g. AI',
    searchable: true,
  },
  { key: 'city', title: 'City', searchable: false },
  { key: 'host', title: 'Host', label: 'Search or select a host', placeholder: 'E.g. Protocol Labs', searchable: true },
];

/** Options for a facet with how many of the given events carry each, most first. */
export function facetOptions(events: CalEvent[], key: FacetKey) {
  const counts = new Map<string, number>();
  events.forEach((e) => facetValues(e, key).forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1)));
  return Array.from(counts, ([value, count]) => ({ value, count, disabled: false })).sort(
    (x, y) => y.count - x.count || x.value.localeCompare(y.value),
  );
}

/** Values within one filter are OR; filters together are AND (the events app's rule). */
export function matchesFilters(event: CalEvent, f: EventFilters, goingUids: Set<string>) {
  if (f.going && !goingUids.has(event.uid)) return false;
  if (f.featured && !FEATURED.has(event.uid)) return false;
  return FACETS.every(({ key }) => !f[key].length || facetValues(event, key).some((v) => f[key].includes(v)));
}

export const iso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const at = (isoDay: string) => new Date(`${isoDay}T12:00:00`);

export const addDays = (isoDay: string, n: number) => {
  const d = at(isoDay);
  d.setDate(d.getDate() + n);
  return iso(d);
};

/** Upcoming = not over yet. A multi-day event already under way still counts. */
export const isUpcoming = (event: CalEvent, todayIso: string) => event.endDate >= todayIso;

/** Where a row sits in the list: its first day, or today if it is already under way. */
export const listDay = (event: CalEvent, todayIso: string) => (event.startDate < todayIso ? todayIso : event.startDate);

export function matchesQuery(event: CalEvent, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const detail = DETAILS[event.uid];
  return [event.name, event.city, ...detail.hosts, ...detail.tags.map((t) => t.name)].some((v) =>
    v.toLowerCase().includes(q),
  );
}

/* ---------- Cities ---------- */

/** A "Browse by city" tile: the city, how many upcoming events, and their span. */
export interface CitySummary {
  city: string;
  eventCount: number;
  startDate: string;
  endDate: string;
  /** "UTC+0", read off the city's first event. */
  zone: string;
}

/** Every city with something coming up (Online is a mode, not a place), most events first. */
export function upcomingCities(todayIso: string): CitySummary[] {
  const byCity = new Map<string, CalEvent[]>();
  CAL_EVENTS.filter((e) => isUpcoming(e, todayIso) && e.city && e.city !== 'Online').forEach((e) =>
    byCity.set(e.city, [...(byCity.get(e.city) ?? []), e]),
  );
  return Array.from(byCity, ([city, list]) => ({
    city,
    eventCount: list.length,
    startDate: list.reduce((m, e) => (e.startDate < m ? e.startDate : m), list[0].startDate),
    endDate: list.reduce((m, e) => (e.endDate > m ? e.endDate : m), list[0].endDate),
    zone: zoneOf(DETAILS[list[0].uid]),
  })).sort((a, b) => b.eventCount - a.eventCount || a.startDate.localeCompare(b.startDate));
}

/** The tiles show the main cities only (Luma shows a handful); the rail's City filter lists them all. */
export const MAIN_CITY_COUNT = 5;

/**
 * Mock: the signed-in member's profile location (production: the member's location city). Drives
 * "Near you" on a plain landing. `?location=none` is a member with no location set;
 * `?location=<City>` tries another city.
 */
export const MEMBER_LOCATION = 'San Francisco';

/* ---------- Labels ---------- */

/** "Dec 1 – 5", "Nov 30 – Dec 2", "Jan 14". */
export function spanLabel(startDate: string, endDate: string) {
  const s = at(startDate);
  const e = at(endDate);
  const md = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (startDate === endDate) return md(s);
  if (s.getMonth() === e.getMonth()) return `${md(s)} – ${e.getDate()}`;
  return `${md(s)} – ${md(e)}`;
}

/** Luma's day header: "Today" / "Tomorrow" / "Nov 19", with the weekday beside it. */
export function dayHeading(isoDay: string, todayIso: string) {
  const d = at(isoDay);
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
  const tomorrow = at(todayIso);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (isoDay === todayIso) return { label: 'Today', weekday };
  if (isoDay === iso(tomorrow)) return { label: 'Tomorrow', weekday };
  return { label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), weekday };
}

/** "Day 2 of 5" for a multi-day event on a given day; empty for one-day events. */
export function dayOfSpan(event: CalEvent, isoDay: string) {
  if (event.startDate === event.endDate) return '';
  const total = Math.round((at(event.endDate).getTime() - at(event.startDate).getTime()) / 86400000) + 1;
  const n = Math.round((at(isoDay).getTime() - at(event.startDate).getTime()) / 86400000) + 1;
  return `Day ${n} of ${total}`;
}

/* ---------- Times (the Schedule view) ---------- */

/** "UTC+0", "UTC−3", "UTC+5:30" from the events app's one-line date. */
export function zoneOf(detail: { dateLine: string }) {
  const tz = detail.dateLine.match(/\(UTC\s*([+-])(\d+):(\d{2})\)/);
  if (!tz) return '';
  const [, sign, hours, minutes] = tz;
  return `UTC${sign === '-' ? '−' : '+'}${Number(hours)}${minutes === '00' ? '' : `:${minutes}`}`;
}

/** Minutes since midnight from "18:00" or "6:00 PM". */
function minutesOf(t: string) {
  const m = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return 0;
  let h = Number(m[1]);
  if (m[3]) {
    h %= 12;
    if (m[3].toUpperCase() === 'PM') h += 12;
  }
  return h * 60 + Number(m[2]);
}

/** "9:00 AM", "6:30 PM". */
export function clock(minutes: number) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

/** One block on the day schedule. Times are minutes in the event's own (local) time. */
export interface Session {
  event: CalEvent;
  title: string;
  /** The event's name when the block is one item of its agenda. */
  partOf?: string;
  about?: string;
  start: number;
  end: number;
  zone: string;
}

/** The agenda day matching an ISO day ("Day 2 - 2nd Dec Wed" ↔ 2026-12-02). */
function agendaDay(detail: (typeof DETAILS)[string], isoDay: string) {
  const d = at(isoDay);
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  return detail.agenda.find((a) => {
    const m = a.day.match(/(\d{1,2})(?:st|nd|rd|th)\s+([A-Za-z]{3})/);
    return !!m && Number(m[1]) === d.getDate() && m[2] === month;
  });
}

/**
 * What happens on one day, LabWeek-schedule style: an event's agenda items for that day when it
 * has them, otherwise the event itself across its daily hours. Times stay in the event's local
 * zone (the dateLine's "(UTC …)"), so a Lisbon day reads in Lisbon time.
 */
export function sessionsOn(events: CalEvent[], isoDay: string): Session[] {
  const out: Session[] = [];
  events
    .filter((e) => e.startDate <= isoDay && e.endDate >= isoDay)
    .forEach((event) => {
      const detail = DETAILS[event.uid];
      const zone = zoneOf(detail);
      const day = agendaDay(detail, isoDay);
      if (day?.items.length) {
        day.items.forEach((item) => {
          const [from, to] = item.time.split(' - ').map((t) => t.trim());
          const start = minutesOf(from);
          out.push({
            event,
            title: item.title,
            partOf: event.name,
            about: item.about,
            start,
            end: to ? minutesOf(to) : start + 60,
            zone,
          });
        });
        return;
      }
      const [from = '09:00', to = '18:00'] = detail.dateLine.match(/\d{2}:\d{2}/g) ?? [];
      const start = minutesOf(from);
      const end = minutesOf(to);
      out.push({ event, title: event.name, start, end: end > start ? end : 24 * 60, zone });
    });
  return out.sort((a, b) => a.start - b.start || b.end - a.end);
}
