// The derive layer: home city + trips -> "where is this person on day X",
// and from that, overlaps with the viewer.
//
// Every date is a 'YYYY-MM-DD' string. Arithmetic goes through Date.UTC and
// comes straight back out as a string, so nothing is ever exposed to the
// browser's local timezone — the same reason production parses IRL dates by
// splitting the string (utils/irl.utils.ts `parseDateString`) instead of
// handing 'YYYY-MM-DD' to `new Date()`.

import type { PersonCityMember, Trip } from './mocks';

export type DateKey = string;

/* ------------------------------------------------------------------ dates */

export function parseKey(key: DateKey): { year: number; month: number; day: number } {
  const [year, month, day] = key.split('-').map((part) => parseInt(part, 10));
  return { year, month, day };
}

export function toKey(year: number, month: number, day: number): DateKey {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/** A calendar day as a UTC Date — only for feeding react-calendar, never for math. */
export function keyToDate(key: DateKey): Date {
  const { year, month, day } = parseKey(key);
  return new Date(year, month - 1, day);
}

export function dateToKey(date: Date): DateKey {
  return toKey(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

export function addDays(key: DateKey, amount: number): DateKey {
  const { year, month, day } = parseKey(key);
  const shifted = new Date(Date.UTC(year, month - 1, day + amount));
  return toKey(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate());
}

export function compareKeys(a: DateKey, b: DateKey): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function isWithin(key: DateKey, start: DateKey, end: DateKey): boolean {
  return key >= start && key <= end;
}

/** Inclusive list of days from `start` to `end`. */
export function eachDay(start: DateKey, end: DateKey): DateKey[] {
  const days: DateKey[] = [];
  let cursor = start;
  // Guard against a reversed range producing an infinite loop.
  while (cursor <= end && days.length < 400) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

export function daysBetween(start: DateKey, end: DateKey): number {
  const a = parseKey(start);
  const b = parseKey(end);
  const ms = Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day);
  return Math.round(ms / 86_400_000);
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function weekdayOf(key: DateKey): string {
  const { year, month, day } = parseKey(key);
  return WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}

export function isWeekend(key: DateKey): boolean {
  const label = weekdayOf(key);
  return label === 'Sat' || label === 'Sun';
}

export function monthLabel(key: DateKey): string {
  const { year, month } = parseKey(key);
  return `${MONTHS[month - 1]} ${year}`;
}

export function shortMonth(key: DateKey): string {
  return MONTHS[parseKey(key).month - 1];
}

/* --------------------------------------------------------------- presence */

export interface Presence {
  city: string;
  country: string;
  /** undefined when the person is at their home city */
  trip?: Trip;
}

/** Trips belonging to one person, earliest first. */
export function tripsFor(memberId: string, trips: Trip[]): Trip[] {
  return trips.filter((trip) => trip.memberId === memberId).sort((a, b) => compareKeys(a.startDate, b.startDate));
}

/**
 * Where a person is on a given day. A trip covering the day wins; otherwise
 * they are at their declared home city — which is why the calendar is never
 * empty and why no input is required to participate.
 */
export function presenceOn(member: PersonCityMember, trips: Trip[], key: DateKey): Presence {
  const trip = trips.find(
    (candidate) => candidate.memberId === member.id && isWithin(key, candidate.startDate, candidate.endDate),
  );
  if (trip) {
    return { city: trip.city, country: trip.country, trip };
  }
  return { city: member.home.city, country: member.home.country };
}

export type PresenceIndex = Map<string, Map<DateKey, Presence>>;

/** Precomputed member -> day -> presence, so the matrix never derives per cell. */
export function buildPresenceIndex(people: PersonCityMember[], trips: Trip[], days: DateKey[]): PresenceIndex {
  const index: PresenceIndex = new Map();
  for (const member of people) {
    const own = trips.filter((trip) => trip.memberId === member.id);
    const byDay = new Map<DateKey, Presence>();
    for (const key of days) {
      const trip = own.find((candidate) => isWithin(key, candidate.startDate, candidate.endDate));
      byDay.set(
        key,
        trip
          ? { city: trip.city, country: trip.country, trip }
          : { city: member.home.city, country: member.home.country },
      );
    }
    index.set(member.id, byDay);
  }
  return index;
}

/* --------------------------------------------------------------- overlaps */

export interface Overlap {
  memberId: string;
  city: string;
  country: string;
  startDate: DateKey;
  endDate: DateKey;
  /** true when at least one of the two people is away from home */
  travelInvolved: boolean;
}

/**
 * Contiguous runs where someone shares the viewer's city.
 *
 * `travelInvolved` matters: two people who both *live* in Austin are colocated
 * every single day — that is the directory's existing location filter, not
 * news. Only overlaps where at least one person is travelling are surfaced in
 * the rail, otherwise the signal drowns in permanent neighbours.
 */
export function findOverlaps(
  viewerId: string,
  people: PersonCityMember[],
  index: PresenceIndex,
  days: DateKey[],
): Overlap[] {
  const mine = index.get(viewerId);
  if (!mine) return [];

  const overlaps: Overlap[] = [];

  for (const member of people) {
    if (member.id === viewerId) continue;
    const theirs = index.get(member.id);
    if (!theirs) continue;

    let run: Overlap | null = null;

    for (const key of days) {
      const my = mine.get(key);
      const their = theirs.get(key);
      const shared = my && their && my.city === their.city;

      if (shared) {
        const travelInvolved = Boolean(my?.trip || their?.trip);
        if (run && run.city === my!.city && run.endDate === addDays(key, -1)) {
          run.endDate = key;
          run.travelInvolved = run.travelInvolved || travelInvolved;
        } else {
          if (run) overlaps.push(run);
          run = {
            memberId: member.id,
            city: my!.city,
            country: my!.country,
            startDate: key,
            endDate: key,
            travelInvolved,
          };
        }
      } else if (run) {
        overlaps.push(run);
        run = null;
      }
    }

    if (run) overlaps.push(run);
  }

  return overlaps.sort((a, b) => compareKeys(a.startDate, b.startDate));
}

/** Overlaps grouped into one card per city + window, for the rail. */
export interface OverlapGroup {
  city: string;
  country: string;
  startDate: DateKey;
  endDate: DateKey;
  memberIds: string[];
}

export function groupOverlaps(overlaps: Overlap[]): OverlapGroup[] {
  const groups = new Map<string, OverlapGroup>();

  for (const overlap of overlaps) {
    if (!overlap.travelInvolved) continue;
    const existing = groups.get(overlap.city);
    if (existing) {
      // Two separate runs in the same city are still one person on the card.
      if (!existing.memberIds.includes(overlap.memberId)) existing.memberIds.push(overlap.memberId);
      if (overlap.startDate < existing.startDate) existing.startDate = overlap.startDate;
      if (overlap.endDate > existing.endDate) existing.endDate = overlap.endDate;
    } else {
      groups.set(overlap.city, {
        city: overlap.city,
        country: overlap.country,
        startDate: overlap.startDate,
        endDate: overlap.endDate,
        memberIds: [overlap.memberId],
      });
    }
  }

  return [...groups.values()].sort((a, b) => compareKeys(a.startDate, b.startDate));
}

/** Everyone present in a city at any point in the window, with their span there. */
export interface CityStay {
  memberId: string;
  startDate: DateKey;
  endDate: DateKey;
  viaTrip: boolean;
}

export interface CityPresence {
  city: string;
  country: string;
  stays: CityStay[];
}

export function buildCityPresence(people: PersonCityMember[], index: PresenceIndex, days: DateKey[]): CityPresence[] {
  const cities = new Map<string, CityPresence>();

  for (const member of people) {
    const byDay = index.get(member.id);
    if (!byDay) continue;

    let run: { city: string; country: string; start: DateKey; end: DateKey; viaTrip: boolean } | null = null;

    const flush = () => {
      if (!run) return;
      const entry = cities.get(run.city) ?? { city: run.city, country: run.country, stays: [] };
      entry.stays.push({ memberId: member.id, startDate: run.start, endDate: run.end, viaTrip: run.viaTrip });
      cities.set(run.city, entry);
      run = null;
    };

    for (const key of days) {
      const presence = byDay.get(key);
      if (!presence) continue;
      if (run && run.city === presence.city) {
        run.end = key;
      } else {
        flush();
        run = {
          city: presence.city,
          country: presence.country,
          start: key,
          end: key,
          viaTrip: Boolean(presence.trip),
        };
      }
    }
    flush();
  }

  return [...cities.values()].sort((a, b) => b.stays.length - a.stays.length || a.city.localeCompare(b.city));
}
