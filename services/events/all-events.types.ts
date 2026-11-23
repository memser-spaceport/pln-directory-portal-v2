import type { EventAccess, EventMode, EventPersonResponse } from './event-drawer.types';

/**
 * One upcoming event as every part of the All Events page reads it (LAB-3247, design D2): the List, Near you, Browse
 * by city and, later, the Calendar and the Map. Shaped once on the server from `GET /v1/irl/events/upcoming` and
 * `GET /v1/irl/events/:uid`; no field depends on the viewer, so the list is cached for everyone.
 */
export interface AllEventsItem {
  uid: string;
  name: string;
  /** ISO instants, as the API sends them. */
  startDate: string;
  endDate: string;
  /** The gathering's IANA time zone ("UTC" when unknown), the one the drawer prints times in. */
  timezone: string;
  /** "2026-12-03": the first and last day in the event's own time zone. */
  startDay: string;
  endDay: string;
  /** "9:00 AM" in the event's time zone. */
  startTime: string;
  /** "6:00 PM": when it ends, in the event's time zone. */
  endTime: string;
  /** "UTC+5:30", "UTC−3", "UTC+0" (a real minus sign, as the prototype prints it). */
  zone: string;
  /** "Lisbon": the gathering's city, title-cased when the source is all lower case. Null for "Others" or none. */
  city: string | null;
  /** `city` lower-cased, for matching against a member's profile city. */
  cityKey: string | null;
  /** The gathering's location text, e.g. "Lisbon, Portugal". Null when the event has no gathering. */
  place: string | null;
  mode: EventMode | null;
  access: EventAccess | null;
  /** Hosts by name, from the events app's host and co-hosts, else the members marked Host. */
  hosts: string[];
  /** Topic names, empty until the events backfill fills `details` (LAB-3214). */
  tags: string[];
  /** The first topic's colour from the events app ("#1E88E5"), for the calendar's faint card wash. */
  tagColor: string | null;
  picture: string | null;
  /** Everyone going. Null when the event hides its attendance (invite-only, signed out). */
  goingCount: number | null;
  /** Up to 3 people going, when attendance shows. */
  faces: EventPersonResponse[];
}

/** What the server hands the page: the events, or that they couldn't load. */
export type AllEventsResult = { ok: true; items: AllEventsItem[] } | { ok: false };
