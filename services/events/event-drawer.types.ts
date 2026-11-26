import type { EventRoleSelection, Resource } from '@/components/core/UpdatesPanel/IrlGatheringModal/types';

import type { EventStatus } from './event-submission.types';

/**
 * The event drawer's wire and view types (LAB-3216).
 *
 * The wire types mirror the BE contracts of LAB-3211 (`libs/contracts/src/schema/pl-event-attendance.ts` and
 * `pl-event-details.ts` on BE `lab-3211`). The view types are what the drawer renders, after
 * `event-drawer.mappers.ts` has normalised them.
 */

export type EventRoleName = 'Host' | 'Speaker' | 'Sponsor';

/** A member shown on an event: a host or one of the faces. */
export interface EventPersonResponse {
  uid: string;
  name: string;
  image: string | null;
}

export interface EventDetailsPartyResponse {
  name: string;
  logo: string | null;
}

/** `PLEvent.additionalInfo.details`, filled by the events sync (LAB-3214). Empty for an event never resynced. */
export interface EventDetailsResponse {
  tags: { name: string; color: string | null }[];
  accessType: string | null;
  accessOption: string | null;
  format: string | null;
  host: EventDetailsPartyResponse | null;
  coHosts: EventDetailsPartyResponse[];
  sponsors: EventDetailsPartyResponse[];
  /** The events service's agenda; `sessions` items are not validated by the BE. */
  agenda: ({ sessions: unknown[] } & Record<string, unknown>) | null;
  /**
   * LAB-3324: the events service's `location_url`, the venue's map link that the PL events app opens from its
   * location arrow. Optional: the BE does not sync it yet, so today it is missing for every event.
   */
  locationUrl?: string | null;
  /** LAB-3403: the event's own IANA time zone. Optional: an older backend does not send it. */
  timezone?: string | null;
}

/** `GET /v1/irl/events/:uid` (`ResponsePLEventDetailSchema`). 404 for an unknown or deleted event. */
export interface EventDetailResponse {
  uid: string;
  name: string;
  slugURL: string;
  type: string | null;
  startDate: string;
  endDate: string;
  /** The approval status, sent to the event's submitter and a directory admin. Absent for other viewers. */
  status?: EventStatus;
  /** True when the dates carry no time of day. Absent on an API that has no all-day events. */
  allDay?: boolean;
  /** The event's own IANA time zone, else its gathering's (LAB-3403). Absent or null: the gathering's is used. */
  timezone?: string | null;
  description: string | null;
  shortDescription: string | null;
  logo: string | null;
  banner: string | null;
  websiteUrl: string | null;
  externalId: string | null;
  resources: unknown[];
  /** The event's own venue (LAB-3281). Null or absent when it has none, or on an older API. */
  venue?: { address: string | null; latitude: number | null; longitude: number | null } | null;
  location: {
    uid: string;
    location: string;
    city: string | null;
    flag: string | null;
    timezone: string | null;
    resources: unknown[];
    events: { uid: string; name: string; type: string | null; startDate: string; endDate: string }[];
  } | null;
  details: EventDetailsResponse | null;
  hosts: EventPersonResponse[];
  goingCount: number;
  faces: EventPersonResponse[];
  viewerGoing: boolean;
  /** The signed-in viewer's own attendance, or null when they are not going. */
  viewer: { showOnProfile: boolean; roles: EventRoleName[] } | null;
}

export type EventMode = 'In-Person' | 'Virtual' | 'Hybrid';
export type EventAccess = 'PAID' | 'FREE w/ RSVP' | 'INVITE ONLY';

/** A tag drawn as the PL events app draws it: a solid hash square and a tinted background. */
export interface EventTag {
  name: string;
  icon: string;
  background: string;
}

export interface EventAgendaDay {
  day: string;
  items: { time: string; title: string; about?: string }[];
}

/** One event of the gathering, as the events picker needs it. */
export interface EventGatheringEvent {
  uid: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface EventGathering {
  uid: string;
  /** The location's full text, e.g. "Lisbon, Portugal". */
  location: string;
  /** `location` up to its first comma. */
  city: string;
  timezone: string;
  resources: Resource[];
  events: EventGatheringEvent[];
}

/** One event, ready to draw. */
export interface EventDetail {
  uid: string;
  name: string;
  startDate: string;
  endDate: string;
  /** The event's own time zone, else its gathering's, else UTC. */
  timezone: string;
  /** The approval status, when the backend sent it: only the submitter and a directory admin get one. */
  status: EventStatus | null;
  /** The dates carry no time of day: the drawer shows the days only. */
  allDay: boolean;
  /** Hidden when unknown. */
  mode: EventMode | null;
  /** Hidden when unknown. */
  access: EventAccess | null;
  /** "19th Nov 2026, 18:00 - 19th Nov 2026, 21:00 (UTC -5:00)", in `timezone`; days only when all-day. */
  dateLine: string;
  /** The event's own venue address, else its gathering's location; never the catch-all "Others". */
  address: string | null;
  /** LAB-3324: the venue's map link (for example Google Maps). Null when the event has none. */
  locationUrl: string | null;
  image: string | null;
  /** The codes of the event's focus areas, e.g. "FA4" (LAB-3404). */
  focusAreas: string[];
  /** The topics: every tag that is not a focus area. */
  tags: EventTag[];
  hosts: string[];
  /** May hold HTML from the events sync; rendered through `SafeHtml`. */
  description: string | null;
  agenda: EventAgendaDay[];
  websiteUrl: string | null;
  /** The event's id in the PL events app (LAB-3361). The drawer does not link it now (LAB-3420). Null when unknown. */
  externalId: string | null;
  /**
   * LAB-3334: the link that the drawer's link row and "Register" open. It is `websiteUrl` when that is an `http` or
   * `https` address. Otherwise it is the link of the event's resource named "Registration" (name match ignores case
   * and end spaces), when that is an `http` or `https` address. Null when neither is.
   */
  eventUrl: string | null;
  gathering: EventGathering | null;
  /** Invite only by its access or by its type: a signed-out visitor does not see who went (LAB-3426). */
  inviteOnly: boolean;
  goingCount: number;
  faces: EventPersonResponse[];
  /** The viewer's own attendance, or null when they are not going (or signed out). */
  viewer: { showOnProfile: boolean; roles: EventRoleName[] } | null;
}

/** One row of the strict attendee list. */
export interface EventAttendee {
  memberUid: string;
  name: string;
  image: string | null;
  /** The member's role at the team they go with. */
  role: string | null;
  teamName: string | null;
  /** Host / Speaker / Sponsor at this event. */
  roles: EventRoleName[];
}

export interface EventAttendeesPage {
  rows: EventAttendee[];
  total: number;
  page: number;
}

/** The viewer's own rows at one gathering, folded into what the plans step edits. */
export interface MyGatheringPlans {
  /** Events at the gathering the viewer is going to. */
  eventUids: string[];
  eventRoles: EventRoleSelection[];
  topics: string[];
  reason: string;
  teamUid: string | null;
  checkInDate: string | null;
  checkOutDate: string | null;
  telegramId: string | null;
  officeHours: string | null;
}

/** `POST /v1/irl/locations/:uid/guests?type=upcoming`. */
export interface CreateEventAttendancePayload {
  memberUid: string;
  teamUid?: string;
  telegramId?: string;
  reason?: string;
  topics?: string[];
  officeHours: string;
  additionalInfo: { checkInDate: string; checkOutDate: string };
  events: EventRolesPayload[];
}

export interface EventRolesPayload {
  uid: string;
  isHost: boolean;
  isSpeaker: boolean;
  isSponsor: boolean;
}

/** `PATCH /v1/irl/locations/:uid/guests/me` (`UpdateMyGuestPlansSchema`). Never creates or deletes rows. */
export interface UpdateMyPlansPayload {
  teamUid?: string | null;
  topics?: string[];
  reason?: string | null;
  telegramId?: string | null;
  officeHours?: string | null;
  additionalInfo?: { checkInDate?: string | null; checkOutDate?: string | null };
  events?: EventRolesPayload[];
}
