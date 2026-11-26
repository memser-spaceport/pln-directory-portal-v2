import { toDisplayCity } from './all-events.filters';
import { eventClock, safeTimezone } from './event-dates';
import { toEventAccess, toEventMode } from './event-drawer.mappers';
import { toFocusAreaCode } from './focus-areas';
import type { AllEventsItem } from './all-events.types';
import type { EventPersonResponse } from './event-drawer.types';

/*
 * One row of `GET /v1/irl/events` as the All Events page reads it (LAB-3418). The same rows, upcoming, go through
 * `toAllEventsItem` (LAB-3278), and the two agree on every field: the clock (all-day included), the place with its
 * venue fallback, the venue's position and Featured. This one stays apart because the rows from the epoch are older and
 * looser: a row that can't be drawn gives null, a value of the wrong kind is skipped, an event that ends before it
 * starts is on its first day, and the event's `type` still marks a mode or an invite-only event.
 */

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const text = (value: unknown): string | null => (typeof value === 'string' && value.trim() ? value.trim() : null);

const instant = (value: unknown): string | null => {
  const date = text(value);
  return date && !Number.isNaN(new Date(date).getTime()) ? date : null;
};

const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const uniqueNames = (names: unknown[]): string[] =>
  Array.from(new Set(names.map(text).filter((name): name is string => !!name)));

const nameOf = (value: unknown) => (isRecord(value) ? value.name : null);

/** The venue's position, or null unless both numbers are there and in range (as `toAllEventsItem` reads it). */
function venuePoint(venue: Record<string, unknown> | null): AllEventsItem['venuePoint'] {
  const { latitude: lat, longitude: lng } = venue ?? {};
  if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

function toFace(value: unknown): EventPersonResponse | null {
  if (!isRecord(value)) return null;
  const uid = text(value.uid);
  return uid ? { uid, name: text(value.name) ?? '', image: text(value.image) } : null;
}

/** One event, or null for a row without a uid, a name or readable dates. Never a field about the viewer. */
export function toPastEventItem(row: unknown): AllEventsItem | null {
  if (!isRecord(row)) return null;
  const uid = text(row.uid);
  const name = text(row.name);
  const startDate = instant(row.startDate);
  const endDate = instant(row.endDate);
  if (!uid || !name || !startDate || !endDate) return null;

  const timezone = safeTimezone(text(row.timezone));
  const allDay = row.allDay === true;
  const clock = eventClock(startDate, endDate, timezone, allDay);
  const tags = uniqueNames(list(row.tags));
  const gathering = isRecord(row.gathering) ? row.gathering : null;
  const venue = isRecord(row.venue) ? row.venue : null;
  const city = toDisplayCity(text(gathering?.city));
  // Null means the event hides its attendance; 0 means nobody said they were going.
  const goingCount = typeof row.goingCount === 'number' && row.goingCount >= 0 ? row.goingCount : null;

  return {
    uid,
    name,
    startDate,
    endDate,
    allDay,
    timezone,
    ...clock,
    // About 40 old events end a minute before they start: they are one-day events on their first day.
    endDay: clock.endDay < clock.startDay ? clock.startDay : clock.endDay,
    city,
    cityKey: city ? city.toLowerCase() : null,
    // As for an upcoming event (LAB-3458): the gathering's city and country, else the event's own venue address.
    place: city ? [city, text(gathering?.country)].filter(Boolean).join(', ') : text(venue?.address),
    venuePoint: venuePoint(venue),
    mode: toEventMode(text(row.format), text(row.type)),
    access: toEventAccess(text(row.accessOption), null, text(row.type)),
    hosts: uniqueNames([nameOf(row.host), ...list(row.coHosts).map(nameOf)]),
    // Most rows have topics only; a few carry the portal's focus area codes among them (LAB-3404).
    focusAreas: Array.from(new Set(tags.map(toFocusAreaCode).filter((code): code is string => !!code))),
    tags: tags.filter((tag) => !toFocusAreaCode(tag)),
    featured: row.isFeatured === true,
    picture: text(row.banner) ?? text(row.logo),
    goingCount,
    faces:
      goingCount === null
        ? []
        : list(row.faces)
            .map(toFace)
            .filter((face): face is EventPersonResponse => !!face)
            .slice(0, 3),
  };
}
