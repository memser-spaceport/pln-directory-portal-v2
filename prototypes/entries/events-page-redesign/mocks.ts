import { GATHERINGS, type Gathering } from '../member-events-going/mocks';
import { CAL_EVENTS, DETAILS, THUMBS, type CalEvent } from '../event-drawer-redesign/mocks';

/**
 * The page reads event-drawer-redesign's event list, so every row opens the
 * same drawer with the same facts. Nothing new is invented here: only views
 * over that list (day groups, gatherings, filters).
 */
export { CAL_EVENTS, DETAILS, THUMBS, GATHERINGS };
export type { CalEvent, Gathering };

export type Filter = 'all' | 'going' | 'in-person' | 'online';

export const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'going', label: 'Going' },
  { value: 'in-person', label: 'In person' },
  { value: 'online', label: 'Online' },
];

export const iso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const at = (isoDay: string) => new Date(`${isoDay}T12:00:00`);

/** Upcoming = not over yet. A multi-day event already under way still counts. */
export const isUpcoming = (event: CalEvent, todayIso: string) => event.endDate >= todayIso;

/** Where a row sits in the list: its first day, or today if it is already under way. */
export const listDay = (event: CalEvent, todayIso: string) =>
  event.startDate < todayIso ? todayIso : event.startDate;

export function matchesFilter(event: CalEvent, filter: Filter, goingUids: Set<string>) {
  const mode = DETAILS[event.uid].mode;
  if (filter === 'going') return goingUids.has(event.uid);
  if (filter === 'in-person') return mode !== 'Virtual';
  if (filter === 'online') return mode !== 'In-Person';
  return true;
}

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
