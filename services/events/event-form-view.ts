import { formatEventDateLine, safeTimezone } from './event-dates';
import { toAgendaDays, toEventAccess, toEventMode, toEventTag } from './event-drawer.mappers';
import type { EventDetail, EventDetailResponse } from './event-drawer.types';
import {
  browserTimezone,
  defaultEventFormValues,
  descriptionText,
  eventInstants,
  fromContactInfos,
  fromInstant,
  toHttpUrl,
} from './event-form';
import type {
  EditableEvent,
  EventAccessOption,
  EventBodyAgenda,
  EventBodyCoHost,
  EventFormat,
  EventFormValues,
  EventStatus,
} from './event-submission.types';

/*
 * The two views of the event form's values: the event as LabOS will show it (Preview and the edit page's read-only
 * view, both drawn by the drawer's `EventSummary`), and the form filled from a stored event (the edit page).
 */

/**
 * `GET /v1/irl/events/:uid` as the edit page reads it: the event read, plus the status and the fields the form fills.
 * The backend returns them to the submitter and a directory admin. Each is optional here, and the mapping falls back
 * to `details`, so an event stored before these fields existed still opens.
 */
export interface EventEditResponse extends EventDetailResponse {
  updatedAt?: string | null;
  logoUid?: string | null;
  format?: string | null;
  accessOption?: string | null;
  tags?: string[] | null;
  hostName?: string | null;
  hostEmail?: string | null;
  coHosts?: EventBodyCoHost[] | null;
  registrationUrl?: string | null;
  meetingUrl?: string | null;
  contactInfos?: Record<string, string[]> | null;
  agenda?: EventBodyAgenda | null;
  address?: {
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    locationUrl?: string | null;
    locationInstructions?: string | null;
  } | null;
}

const FORMAT_BY_MODE: Record<string, EventFormat> = { 'In-Person': 'IN_PERSON', Virtual: 'VIRTUAL', Hybrid: 'HYBRID' };
const ACCESS_BY_LABEL: Record<string, EventAccessOption> = {
  'FREE w/ RSVP': 'OPEN',
  PAID: 'PAID',
  'INVITE ONLY': 'INVITE',
};

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

function readAgenda(raw: EventEditResponse): EventBodyAgenda | null {
  const agenda = raw.agenda ?? raw.details?.agenda;
  if (!agenda || !Array.isArray(agenda.sessions) || !agenda.sessions.length) return null;
  const summary = (agenda as { agendaSummary?: unknown }).agendaSummary;
  return {
    sessions: agenda.sessions as EventBodyAgenda['sessions'],
    agendaSummary: typeof summary === 'string' ? summary : null,
  };
}

/** A stored event as the edit page holds it: its status, and the form filled with its values. */
export function toEditableEvent(raw: EventEditResponse): EditableEvent {
  const details = raw.details;
  const timezone = safeTimezone(raw.timezone || raw.location?.timezone || browserTimezone());
  const start = fromInstant(raw.startDate, timezone);
  const end = fromInstant(raw.endDate, timezone);
  const mode = toEventMode(raw.format ?? details?.format, raw.type);
  const access = toEventAccess(raw.accessOption ?? details?.accessOption, details?.accessType, raw.type);
  const address = raw.address;
  const venue = text(address?.address);
  const hasPlace = !!address && (address.latitude != null || !!text(address.city));
  const coHosts = raw.coHosts ?? details?.coHosts ?? [];
  const tags = raw.tags ?? (details?.tags ?? []).map((tag) => tag.name);

  const values: EventFormValues = {
    ...defaultEventFormValues(timezone),
    accessOption: (access && ACCESS_BY_LABEL[access]) || 'OPEN',
    registrationUrl: text(raw.registrationUrl),
    logo: raw.logo ? { kind: 'stored', uid: raw.logoUid ?? null, url: raw.logo } : null,
    name: raw.name ?? '',
    format: (mode && FORMAT_BY_MODE[mode]) || 'IN_PERSON',
    venue,
    place:
      venue && hasPlace
        ? {
            city: address?.city ?? null,
            state: address?.state ?? null,
            country: address?.country ?? null,
            latitude: address?.latitude ?? null,
            longitude: address?.longitude ?? null,
            locationUrl: address?.locationUrl ?? details?.locationUrl ?? null,
          }
        : null,
    instruction: text(address?.locationInstructions),
    meetingUrl: text(raw.meetingUrl),
    startDay: start.day,
    startTime: start.time,
    endDay: end.day,
    endTime: end.time,
    description: raw.description ?? '',
    agenda: readAgenda(raw),
    tags: Array.from(new Set(tags.map(text).filter(Boolean))),
    hostName: text(raw.hostName) || text(details?.host?.name),
    hostEmail: text(raw.hostEmail),
    coHosts: coHosts.map((coHost) => ({ name: text(coHost?.name), email: text((coHost as EventBodyCoHost)?.email) })),
    websiteUrl: text(raw.websiteUrl),
    socialHandles: fromContactInfos(raw.contactInfos),
  };

  return {
    uid: raw.uid,
    // An event read with no status is one every visitor can read: an approved event.
    status: raw.status ?? 'APPROVED',
    values,
    logoUrl: raw.logo ?? null,
    updatedAt: raw.updatedAt ?? null,
  };
}

/**
 * The event as LabOS will show it, from the values typed so far: what Preview and the edit page's read-only view
 * draw. A missing value is left out, as the drawer does for a stored event.
 */
export function toPreviewEvent(values: EventFormValues, uid = 'preview'): EventDetail {
  const timezone = safeTimezone(values.timezone);
  const instants = eventInstants(values);
  const hasVenue = values.format !== 'VIRTUAL';
  const venue = hasVenue ? values.venue.trim() : '';
  const place = venue ? values.place : null;
  const hosts = [values.hostName, ...values.coHosts.map((coHost) => coHost.name)]
    .map((name) => name.trim())
    .filter(Boolean);
  const link = toHttpUrl(values.registrationUrl) ?? toHttpUrl(values.websiteUrl);

  return {
    uid,
    externalId: null,
    name: values.name.trim() || 'Untitled event',
    startDate: instants?.start ?? '',
    endDate: instants?.end ?? '',
    timezone,
    status: null,
    allDay: false,
    mode: toEventMode(values.format),
    access: toEventAccess(values.accessOption),
    dateLine: instants ? formatEventDateLine(instants.start, instants.end, timezone) : '',
    address: venue || null,
    locationUrl: place?.locationUrl ?? null,
    image: values.logo ? (values.logo.kind === 'file' ? values.logo.previewUrl : values.logo.url) : null,
    tags: values.tags.map(toEventTag),
    hosts: Array.from(new Set(hosts)),
    description: descriptionText(values.description) ? values.description : null,
    agenda: toAgendaDays(values.agenda ? { ...values.agenda } : null, timezone),
    websiteUrl: toHttpUrl(values.websiteUrl),
    eventUrl: link,
    gathering: null,
    goingCount: 0,
    faces: [],
    viewer: null,
  };
}
