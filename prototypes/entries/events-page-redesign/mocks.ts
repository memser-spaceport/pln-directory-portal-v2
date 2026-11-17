import { GATHERINGS, type Gathering } from '../member-events-going/mocks';
import { CAL_EVENTS, DETAILS, THUMBS, type CalEvent } from '../event-drawer-redesign/mocks';

/**
 * The page reads event-drawer-redesign's event list, so every row opens the
 * same drawer with the same facts. Nothing new is invented here: only views
 * over that list (day groups, gatherings, filters).
 */
export { CAL_EVENTS, DETAILS, THUMBS, GATHERINGS };
export type { CalEvent, Gathering };

/**
 * The events app's Filters rail (/events/all), kept in full and moved to the directory's left
 * rail: Show featured events, Modes, Access Types, Focus Areas, Gatherings, Hosts. Plus "Going",
 * the page's own view of your plans. Values are the labels the rail shows (GenericCheckboxList
 * stores what it displays), and options come off the events, so none is ever empty.
 */
export type FacetKey = 'mode' | 'access' | 'focus' | 'gathering' | 'host';

export interface EventFilters {
  going: boolean;
  featured: boolean;
  mode: string[];
  access: string[];
  focus: string[];
  gathering: string[];
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
  if (key === 'gathering') {
    const g = event.gatheringUid ? GATHERINGS.find((x) => x.uid === event.gatheringUid) : null;
    return g ? [g.city] : [];
  }
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
  { key: 'gathering', title: 'Gathering', searchable: false },
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

/** A gathering card: the city, its span, how many events and members. */
export interface GatheringSummary {
  gathering: Gathering;
  startDate: string;
  endDate: string;
  eventCount: number;
}

export function upcomingGatherings(todayIso: string): GatheringSummary[] {
  return GATHERINGS.map((gathering) => {
    const events = CAL_EVENTS.filter((e) => e.gatheringUid === gathering.uid && isUpcoming(e, todayIso));
    if (!events.length) return null;
    return {
      gathering,
      startDate: events.reduce((m, e) => (e.startDate < m ? e.startDate : m), events[0].startDate),
      endDate: events.reduce((m, e) => (e.endDate > m ? e.endDate : m), events[0].endDate),
      eventCount: events.length,
    };
  })
    .filter((g): g is GatheringSummary => !!g)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

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
