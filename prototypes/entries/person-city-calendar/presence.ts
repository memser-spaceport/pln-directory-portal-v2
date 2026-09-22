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

/* ------------------------------------------------------- who else is there */

export interface Companion {
  member: PersonCityMember;
  /** the days you share, clipped to your own stay */
  startDate: DateKey;
  endDate: DateKey;
}

/**
 * Everyone else in `city` at any point between `start` and `end` — visiting or
 * based there. This is the payoff for entering dates at all, so every surface
 * that shows a stay can also say who it puts you next to.
 */
export function companionsFor(
  city: string,
  start: DateKey,
  end: DateKey,
  people: PersonCityMember[],
  trips: Trip[],
  excludeId: string,
): Companion[] {
  const days = eachDay(start, end);
  const found: Companion[] = [];
  for (const member of people) {
    if (member.id === excludeId) continue;
    const shared = days.filter((day) => presenceOn(member, trips, day).city === city);
    if (shared.length === 0) continue;
    found.push({ member, startDate: shared[0], endDate: shared[shared.length - 1] });
  }
  return found;
}

/** "Lucas Moreau" · "Lucas Moreau and Nadia Haddad" · "Lucas Moreau, Nadia Haddad and 2 others". */
export function nameList(names: string[]): string {
  if (names.length <= 2) return names.join(' and ');
  const rest = names.length - 2;
  return `${names[0]}, ${names[1]} and ${rest} ${rest === 1 ? 'other' : 'others'}`;
}
