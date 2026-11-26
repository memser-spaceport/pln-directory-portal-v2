import type { EventAccess, EventMode, EventPersonResponse } from './event-drawer.types';

/** `GET /v1/irl/events`: one page of approved events that have not ended, earliest first. */
export interface EventListResponse {
  page: number;
  limit: number;
  total: number;
  items: EventListItemResponse[];
}

/** One event of the list. A missing value is null or an empty list. */
export interface EventListItemResponse {
  uid: string;
  name: string;
  /** ISO instants, or `YYYY-MM-DD` days for an all-day event. */
  startDate: string;
  endDate: string;
  allDay: boolean;
  timezone: string | null;
  format: 'IN_PERSON' | 'VIRTUAL' | 'HYBRID' | null;
  accessOption: 'OPEN' | 'INVITE' | 'PAID' | null;
  tags: string[];
  isFeatured: boolean;
  logo: string | null;
  banner: string | null;
  host: { name: string; logo: string | null } | null;
  /** The event's co-hosts, so the Host filter matches them too. Absent on an API that does not list them. */
  coHosts?: { name: string }[] | null;
  /** Null for a virtual event. */
  gathering: { uid: string; city: string | null; country: string | null } | null;
  venue: { address: string | null; latitude: number | null; longitude: number | null } | null;
  /** Null when the event hides its attendance (invite-only). */
  goingCount: number | null;
  faces: EventPersonResponse[];
  /** Only for a signed-in viewer. The page loads signed out and never reads it. */
  isGoing?: boolean;
}

/**
 * One event as every part of the All Events page reads it: the List, Near you, Browse by city, the Calendar and the
 * Map. Shaped once on the server from `GET /v1/irl/events` (an upcoming one from its default list, a past one from the
 * list from the epoch, LAB-3418); no field depends on the viewer, so the list is cached for everyone.
 */
export interface AllEventsItem {
  uid: string;
  name: string;
  /** ISO instants, as the API sends them; `YYYY-MM-DD` days for an all-day event. */
  startDate: string;
  endDate: string;
  /** The dates carry no time of day: `startTime`, `endTime` and `zone` are empty. */
  allDay: boolean;
  /** The event's own IANA time zone, else its gathering's, else "UTC": the one the drawer prints times in. */
  timezone: string;
  /** "2026-12-03": the first and last day in the event's own time zone. */
  startDay: string;
  endDay: string;
  /** "9:00 AM" in the event's time zone. Empty for an all-day event. */
  startTime: string;
  /** "6:00 PM": when it ends, in the event's time zone. Empty for an all-day event. */
  endTime: string;
  /** "UTC+5:30", "UTC−3", "UTC+0" (a real minus sign, as the prototype prints it). Empty for an all-day event. */
  zone: string;
  /** "Lisbon": the gathering's city, title-cased when the source is all lower case. Null for "Others" or none. */
  city: string | null;
  /** `city` lower-cased, for matching against a member's profile city. */
  cityKey: string | null;
  /**
   * The gathering's city and country, e.g. "Lisbon, Portugal". For an event whose gathering is "Others" or missing, its
   * own venue address. Null when it has neither.
   */
  place: string | null;
  /** The event's own venue position, for the Map when its city has none. Null when the event has no position. */
  venuePoint: { lat: number; lng: number } | null;
  mode: EventMode | null;
  access: EventAccess | null;
  /** Hosts by name: the event's host, then its co-hosts. */
  hosts: string[];
  /** The codes of the event's focus areas, e.g. "FA4" (LAB-3404). */
  focusAreas: string[];
  /** Topic names: the tags that are not focus areas. Empty until the events sync fills `details` (LAB-3214). */
  tags: string[];
  featured: boolean;
  picture: string | null;
  /** Everyone going. Null when the event hides its attendance (invite-only, signed out). */
  goingCount: number | null;
  /** Up to 3 people going, when attendance shows. */
  faces: EventPersonResponse[];
}

/** What the server hands the page: the events, or that they couldn't load. */
export type AllEventsResult = { ok: true; items: AllEventsItem[] } | { ok: false };
