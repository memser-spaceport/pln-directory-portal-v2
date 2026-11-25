/**
 * Wire and form types for submitting and editing an event in LabOS.
 *
 * The wire types mirror the backend's event body (`libs/contracts/src/schema/pl-event-body.ts` in
 * `pln-directory-portal`) and the routes under `/v1/irl/events`. The form types are what `EventForm` holds while a
 * person types; `event-form.ts` maps between the two.
 */

export type EventStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type EventFormat = 'IN_PERSON' | 'VIRTUAL' | 'HYBRID';
export type EventAccessOption = 'OPEN' | 'PAID' | 'INVITE';

export interface EventBodyAddress {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationInstructions?: string | null;
}

export interface EventBodyCoHost {
  name: string;
  email?: string | null;
}

/** One agenda session, as the agenda parser returns it and the backend stores it. Instants in UTC. */
export interface EventAgendaSession {
  name: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  timezone?: string | null;
}

export interface EventBodyAgenda {
  sessions: EventAgendaSession[];
  /** The agenda text the person pasted. */
  agendaSummary?: string | null;
}

/** Addresses by platform: `{ twitter: ['https://x.com/pl'], email: ['events@pl.xyz'] }`. */
export type EventContactInfos = Record<string, string[]>;

/** The fields of an event write. `null` clears a value on an edit. */
export interface EventBodyFields {
  name: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  timezone: string;
  /** The form makes timed events only. All-day events come from partner apps. */
  allDay: boolean;
  format: EventFormat;
  accessOption: EventAccessOption;
  tags: string[];
  hostName?: string | null;
  hostEmail?: string | null;
  coHosts?: EventBodyCoHost[];
  websiteUrl?: string | null;
  registrationUrl?: string | null;
  meetingUrl?: string | null;
  locationUrl?: string | null;
  contactInfos?: EventContactInfos | null;
  agenda?: EventBodyAgenda | null;
  address?: EventBodyAddress | null;
  logoUid?: string | null;
}

/** `POST /v1/irl/events`, for a signed-in member. `draft: true` stores a draft. */
export interface SubmitEventBody extends EventBodyFields {
  draft?: boolean;
}

/** `PATCH /v1/irl/events/:uid`. `submit: true` sends a draft for publishing. An edit never changes the status. */
export interface UpdateEventBody extends Partial<EventBodyFields> {
  submit?: boolean;
}

/** What a create or an edit answers: the event and the status the backend gave it. */
export interface EventWriteResult {
  uid: string;
  status: EventStatus;
}

/** One row of `GET /v1/irl/events/mine`. */
export interface MyEventResponse {
  uid: string;
  name: string;
  startDate: string;
  endDate: string;
  status: EventStatus;
  reviewNote?: string | null;
  timezone?: string | null;
  allDay?: boolean;
  updatedAt?: string | null;
  createdAt?: string | null;
}

/** One venue suggestion of `GET /v1/irl/events/places`. */
export interface PlaceSuggestion {
  text: string;
  placeId: string;
}

/** `GET /v1/irl/events/places/resolve`: a place with its position, map link and time zone. */
export interface ResolvedPlace {
  address: string;
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  locationUrl: string | null;
  /** IANA name; null when the time zone lookup failed. */
  timezone: string | null;
}

/** `POST /v1/irl/events/agenda/parse`: sessions, or a message that says what is missing. */
export interface ParsedAgenda {
  sessions: EventAgendaSession[];
  message: string | null;
}

/** An event as the edit page loads it: the event read, with the status and every field the form fills. */
export interface EditableEvent {
  uid: string;
  status: EventStatus;
  /** A draft, a submitted or an approved event can be edited; a rejected one is read-only. */
  values: EventFormValues;
  /** The stored logo's address, shown until the person replaces or deletes it. */
  logoUrl: string | null;
  updatedAt: string | null;
}

/* ---------- Form ---------- */

export interface EventFormCoHost {
  name: string;
  email: string;
}

export interface EventFormSocialHandle {
  /** `twitter`, `discord`, `bluesky`, `mastodon`, `telegram`, `email`; empty until one is chosen. */
  platform: string;
  handle: string;
}

/** The venue a person resolved: a suggestion they picked, or the text they pressed Enter on. */
export interface EventFormPlace {
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  locationUrl: string | null;
}

/** The logo in the form: a new file (uploaded when the form is sent), or the event's stored image. */
export type EventFormLogo =
  | { kind: 'file'; file: File; previewUrl: string }
  | { kind: 'stored'; uid: string | null; url: string }
  | null;

/** What `EventForm` holds. Dates and times are wall-clock values in `timezone`. */
export interface EventFormValues {
  accessOption: EventAccessOption;
  registrationUrl: string;
  logo: EventFormLogo;
  name: string;
  format: EventFormat;
  /** The venue text, resolved or not. */
  venue: string;
  place: EventFormPlace | null;
  instruction: string;
  meetingUrl: string;
  /** "2026-12-03"; empty until picked. */
  startDay: string;
  /** "09:15", 24-hour, in 15-minute steps. */
  startTime: string;
  endDay: string;
  endTime: string;
  timezone: string;
  /** HTML from the editor. */
  description: string;
  agenda: EventBodyAgenda | null;
  tags: string[];
  hostName: string;
  hostEmail: string;
  coHosts: EventFormCoHost[];
  /** Edit page only. */
  websiteUrl: string;
  socialHandles: EventFormSocialHandle[];
}

/** Messages by field. `coHosts` and `socialHandles` carry one entry per row. */
export interface EventFormErrors {
  name?: string;
  dates?: string;
  timezone?: string;
  description?: string;
  tags?: string;
  hostName?: string;
  coHosts?: ({ name?: string; email?: string } | undefined)[];
  registrationUrl?: string;
  venue?: string;
  meetingUrl?: string;
  websiteUrl?: string;
  socialHandles?: (string | undefined)[];
  agenda?: string;
}

export type EventFormMode = 'submit' | 'draft';
