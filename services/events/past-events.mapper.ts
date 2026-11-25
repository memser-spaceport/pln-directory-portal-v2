import { formatInTimeZone } from 'date-fns-tz';

import { toDisplayCity } from './all-events.filters';
import { toZoneLabel } from './all-events.service';
import { toEventAccess, toEventMode } from './event-drawer.mappers';
import { toFocusAreaCode } from './focus-areas';
import type { AllEventsItem } from './all-events.types';
import type { EventPersonResponse } from './event-drawer.types';

/*
 * One row of `GET /v1/irl/events` as the All Events page reads it (LAB-3418). It mirrors `toAllEventsItem(row)` on
 * `lab-3278`, which maps the same rows for upcoming events: when that branch lands, drop this file and use that one.
 * Two differences until then: a row that can't be drawn gives null here, and a date-only (all-day) row is read as
 * midnight UTC, as the rest of the page reads dates today. No past event is all-day.
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

/** The zone itself when dates can be printed in it, otherwise "UTC", as the page does for an event without one. */
function safeTimezone(value: unknown): string {
  const timezone = text(value);
  if (!timezone) return 'UTC';
  try {
    formatInTimeZone(new Date(0), timezone, 'xxx');
    return timezone;
  } catch {
    return 'UTC';
  }
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

  const timezone = safeTimezone(row.timezone);
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startDay = formatInTimeZone(start, timezone, 'yyyy-MM-dd');
  const endDay = formatInTimeZone(end, timezone, 'yyyy-MM-dd');
  const tags = uniqueNames(list(row.tags));
  const gathering = isRecord(row.gathering) ? row.gathering : null;
  const city = toDisplayCity(text(gathering?.city));
  // Null means the event hides its attendance; 0 means nobody said they were going.
  const goingCount = typeof row.goingCount === 'number' && row.goingCount >= 0 ? row.goingCount : null;

  return {
    uid,
    name,
    startDate,
    endDate,
    timezone,
    startDay,
    // About 40 old events end a minute before they start: they are one-day events on their first day.
    endDay: endDay < startDay ? startDay : endDay,
    startTime: formatInTimeZone(start, timezone, 'h:mm a'),
    endTime: formatInTimeZone(end, timezone, 'h:mm a'),
    zone: toZoneLabel(start, timezone),
    city,
    cityKey: city ? city.toLowerCase() : null,
    place: city ? [city, text(gathering?.country)].filter(Boolean).join(', ') : null,
    mode: toEventMode(text(row.format), text(row.type)),
    access: toEventAccess(text(row.accessOption), null, text(row.type)),
    hosts: uniqueNames([nameOf(row.host), ...list(row.coHosts).map(nameOf)]),
    // Most rows have topics only; a few carry the portal's focus area codes among them (LAB-3404).
    focusAreas: Array.from(new Set(tags.map(toFocusAreaCode).filter((code): code is string => !!code))),
    tags: tags.filter((tag) => !toFocusAreaCode(tag)),
    tagColor: null,
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
