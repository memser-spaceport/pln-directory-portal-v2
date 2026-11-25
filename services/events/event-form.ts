import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

import { plainSpaces } from '@/utils/html/plainSpaces';

import { safeTimezone } from './event-dates';
import type {
  EventAccessOption,
  EventAgendaSession,
  EventBodyAgenda,
  EventBodyFields,
  EventContactInfos,
  EventFormat,
  EventFormErrors,
  EventFormMode,
  EventFormSocialHandle,
  EventFormValues,
  EventStatus,
} from './event-submission.types';

/*
 * The event form's rules, with no React in them: defaults, the date and time rules, the wall-clock mapping, the
 * checks with their texts, and the one mapping from form values to the request body. The fields, rules and texts are
 * the old submission portal's (`pl-events-submission`); only the look is LabOS.
 */

/* ---------- Options and texts ---------- */

export const ACCESS_OPTIONS: { value: EventAccessOption; label: string }[] = [
  { value: 'OPEN', label: 'Free/RSVP' },
  { value: 'PAID', label: 'Paid' },
  { value: 'INVITE', label: 'Invite Only' },
];

export const FORMAT_OPTIONS: { value: EventFormat; label: string }[] = [
  { value: 'IN_PERSON', label: 'In Person' },
  { value: 'VIRTUAL', label: 'Online' },
  { value: 'HYBRID', label: 'Hybrid' },
];

export const DEFAULT_EVENT_TAGS = ['Talks & Presentation', 'Hackathon', 'Workshop', 'Art Exhibition', 'Social Event'];

export const SOCIAL_PLATFORMS: { value: string; label: string }[] = [
  { value: 'twitter', label: 'Twitter' },
  { value: 'discord', label: 'Discord' },
  { value: 'bluesky', label: 'Bluesky' },
  { value: 'mastodon', label: 'Mastodon' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'email', label: 'Email' },
];

export const EVENT_NAME_MAX = 100;

/**
 * The longest description, in characters of text. The API takes up to 50,000 characters of HTML; the limit on the
 * text leaves room for the tags.
 */
export const EVENT_DESCRIPTION_MAX = 10000;

/** The longest link the API takes. */
export const EVENT_LINK_MAX = 2048;

/** What the UI calls each backend status. `PENDING` reads "Submitted". */
export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  DRAFT: 'Draft',
  PENDING: 'Submitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export const EVENT_FORM_TEXT = {
  nameRequired: 'Event name required',
  descriptionTooLong: 'Description must be at most 10,000 characters',
  datesRequired: 'Start date and end date is required',
  endBeforeStart: 'End date must be after start date',
  timezoneRequired: 'Time zone is required',
  tagRequired: 'At least one tag is required',
  hostRequired: 'Enter a valid host name',
  coHostNameRequired: 'Co-host name is required',
  emailInvalid: 'Enter a valid email',
  registrationInvalid: 'Enter a valid registration link',
  meetingInvalid: 'Enter a valid meeting link',
  websiteInvalid: 'Enter a valid website link',
  platformRequired: 'Please select a platform',
  handleInvalid: 'Enter a valid handle',
  agendaNeedsDates: 'Please select start and end date before adding agenda items.',
  agendaNeedsEventDates: 'Please set your event start date, end date, and timezone first',
  logoHint: 'Logo: a square (1:1) PNG or JPEG, up to 4MB',
  logoTooLarge: 'Image size should be less than 4MB',
  logoNotSquare: 'Image must have a 1:1 aspect ratio',
  created: 'Event Created Successfully',
  draftCreated: 'Draft Event Created Successfully',
  submitted: 'Event Submitted Successfully',
  updated: 'Event Updated Successfully',
  deleted: 'Event deleted successfully',
  cleared: 'Form has been cleared successfully',
  failed: 'Something went wrong please try again.',
  updateFailed: 'Failed to update event. Please try again.',
  tooMany: 'Too many submissions. Please try again later.',
} as const;

/* ---------- Defaults ---------- */

/** The visitor's own IANA time zone, "UTC" when the browser has none. */
export function browserTimezone(): string {
  try {
    return safeTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  } catch {
    return 'UTC';
  }
}

export function defaultEventFormValues(timezone: string): EventFormValues {
  return {
    accessOption: 'OPEN',
    registrationUrl: '',
    logo: null,
    name: '',
    format: 'IN_PERSON',
    venue: '',
    place: null,
    instruction: '',
    meetingUrl: '',
    startDay: '',
    startTime: '00:00',
    endDay: '',
    endTime: '00:00',
    timezone,
    description: '',
    agenda: null,
    tags: [DEFAULT_EVENT_TAGS[0]],
    hostName: '',
    hostEmail: '',
    coHosts: [],
    websiteUrl: '',
    socialHandles: [],
  };
}

/* ---------- Dates and times ---------- */

const pad = (n: number) => String(n).padStart(2, '0');

/** The time list: every 15 minutes, "00:00" to "23:45", with the label a person reads ("12:00 AM"). */
export const TIME_OPTIONS: { value: string; label: string }[] = Array.from({ length: 96 }, (_, index) => {
  const hours = Math.floor(index / 4);
  const minutes = (index % 4) * 15;
  const label = `${hours % 12 === 0 ? 12 : hours % 12}:${pad(minutes)} ${hours < 12 ? 'AM' : 'PM'}`;
  return { value: `${pad(hours)}:${pad(minutes)}`, label };
});

const MIDNIGHT = '00:00';
const LAST_SLOT = '23:45';

type DateFields = Pick<EventFormValues, 'startDay' | 'startTime' | 'endDay' | 'endTime'>;

/** Picking a start date resets the start time to 12:00 AM. A same-day event ends at 23:45. */
export function pickStartDay(values: DateFields, day: string): DateFields {
  const next = { ...values, startDay: day, startTime: MIDNIGHT };
  return day && day === values.endDay ? { ...next, endTime: LAST_SLOT } : next;
}

/** Picking an end date resets the end time to 12:00 AM; on the start's own day it is set to 23:45. */
export function pickEndDay(values: DateFields, day: string): DateFields {
  return { ...values, endDay: day, endTime: day && day === values.startDay ? LAST_SLOT : MIDNIGHT };
}

/** On one day, a start at or after the end is not offered. */
export function isStartTimeDisabled(values: DateFields, time: string): boolean {
  return !!values.startDay && values.startDay === values.endDay && time >= values.endTime;
}

/** On one day, an end at or before the start is not offered. */
export function isEndTimeDisabled(values: DateFields, time: string): boolean {
  return !!values.startDay && values.startDay === values.endDay && time <= values.startTime;
}

/** A wall-clock day and time in a time zone, as the instant it is: ("2026-03-29", "09:00", "Europe/Lisbon"). */
export function toInstant(day: string, time: string, timezone: string): string {
  return fromZonedTime(`${day}T${time || MIDNIGHT}:00`, safeTimezone(timezone)).toISOString();
}

/** The reverse of `toInstant`: an instant as the day and time a clock in that time zone shows. */
export function fromInstant(instant: string, timezone: string): { day: string; time: string } {
  const date = new Date(instant);
  if (Number.isNaN(date.getTime())) return { day: '', time: MIDNIGHT };
  const tz = safeTimezone(timezone);
  return { day: formatInTimeZone(date, tz, 'yyyy-MM-dd'), time: formatInTimeZone(date, tz, 'HH:mm') };
}

/** The event's start and end as instants, or null while a date is missing. */
export function eventInstants(values: EventFormValues): { start: string; end: string } | null {
  if (!values.startDay || !values.endDay || !values.timezone) return null;
  return {
    start: toInstant(values.startDay, values.startTime, values.timezone),
    end: toInstant(values.endDay, values.endTime, values.timezone),
  };
}

/* ---------- Agenda ---------- */

/** Each session keeps its clock time when the event moves to another time zone. */
export function moveAgendaToTimezone(agenda: EventBodyAgenda | null, from: string, to: string): EventBodyAgenda | null {
  if (!agenda || from === to) return agenda;
  const move = (instant: string) => {
    const { day, time } = fromInstant(instant, from);
    return day ? toInstant(day, time, to) : instant;
  };
  return {
    ...agenda,
    sessions: agenda.sessions.map((session) => ({
      ...session,
      start_date: move(session.start_date),
      end_date: move(session.end_date),
      timezone: to,
    })),
  };
}

export interface AgendaDay {
  /** "Day 1". */
  label: string;
  /** "Jan 28, Wed". */
  date: string;
  items: { time: string; title: string; description: string | null }[];
}

/** Sessions grouped by their day in the event's time zone, earliest first: "10:00 AM – 10:30 AM" and the title. */
export function groupAgendaByDay(agenda: EventBodyAgenda | null, timezone: string): AgendaDay[] {
  const tz = safeTimezone(timezone);
  const sessions = [...(agenda?.sessions ?? [])]
    .filter((session) => !Number.isNaN(new Date(session.start_date).getTime()))
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  const days = new Map<string, AgendaDay>();
  sessions.forEach((session) => {
    const start = new Date(session.start_date);
    const end = new Date(session.end_date);
    const key = formatInTimeZone(start, tz, 'yyyy-MM-dd');
    if (!days.has(key)) {
      days.set(key, { label: `Day ${days.size + 1}`, date: formatInTimeZone(start, tz, 'MMM d, EEE'), items: [] });
    }
    const startText = formatInTimeZone(start, tz, 'h:mm a');
    const time = Number.isNaN(end.getTime()) ? startText : `${startText} – ${formatInTimeZone(end, tz, 'h:mm a')}`;
    days.get(key)?.items.push({ time, title: session.name, description: session.description?.trim() || null });
  });
  return Array.from(days.values());
}

/**
 * Every session is inside the event and ends after it starts. Returns the message for the first session that is not,
 * naming it, or null.
 */
export function agendaIssue(
  sessions: EventAgendaSession[],
  eventStart: string,
  eventEnd: string,
  timezone: string,
): string | null {
  const tz = safeTimezone(timezone);
  const valid = sessions.filter((session) => session.start_date && session.end_date);
  const day = (date: Date) => formatInTimeZone(date, tz, 'yyyy-MM-dd');
  const shortDay = (date: Date) => formatInTimeZone(date, tz, 'MMM d');
  const clock = (date: Date) => formatInTimeZone(date, tz, 'h:mm a');
  const start = new Date(eventStart);
  const end = new Date(eventEnd);

  for (const session of valid) {
    const sessionStart = new Date(session.start_date);
    if (day(sessionStart) < day(start)) {
      return `"${session.name}" is on ${shortDay(sessionStart)}, but your event is ${shortDay(start)}. Check the date.`;
    }
    if (day(sessionStart) > day(end)) {
      return `"${session.name}" is on ${shortDay(sessionStart)}, but your event ends ${shortDay(end)}. Check the date.`;
    }
  }
  for (const session of valid) {
    const sessionStart = new Date(session.start_date);
    const sessionEnd = new Date(session.end_date);
    if (sessionStart.getTime() >= sessionEnd.getTime()) {
      return `"${session.name}" has invalid times: starts at ${clock(sessionStart)} but ends at ${clock(sessionEnd)}. The end time must be after the start time.`;
    }
    if (sessionStart.getTime() < start.getTime()) {
      return `"${session.name}" starts at ${clock(sessionStart)}, but your event starts at ${clock(start)}. Check the time.`;
    }
    if (sessionEnd.getTime() > end.getTime()) {
      return `"${session.name}" ends at ${clock(sessionEnd)}, but your event ends at ${clock(end)}. Check the time.`;
    }
  }
  return null;
}

/* ---------- Links, emails, social handles ---------- */

const EMAIL_REGEX = /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})$/;
const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,})([/\w .%&=#:+?@~,;!$'()*-]*)*\/?$/i;

export const isValidEmail = (email: string) => EMAIL_REGEX.test(email.trim());

/** A web address, with or without "https://" in front. */
export const isValidUrl = (url: string) => URL_REGEX.test(url.trim());

/** The address as the backend takes it: "example.com/x" becomes "https://example.com/x". Empty stays null. */
export function toHttpUrl(url: string): string | null {
  const value = url.trim();
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

/** A handle that is not a web address becomes the platform's profile address: "@plabs" on Twitter → x.com/plabs. */
export function normalizeSocialHandle(platform: string, handle: string): string {
  const value = handle.trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  const clean = value.startsWith('@') ? value.substring(1) : value;

  switch (platform.toLowerCase()) {
    case 'twitter':
      return `https://x.com/${clean}`;
    case 'mastodon': {
      if (clean.includes('@')) {
        const [user, instance] = clean.split('@');
        return `https://${instance}/@${user}`;
      }
      return `https://mastodon.social/@${clean}`;
    }
    case 'discord': {
      if (clean.includes('/')) {
        const parts = clean.split('/');
        return `https://discord.gg/${parts[parts.length - 1]}`;
      }
      return `https://discord.com/users/${clean}`;
    }
    case 'bluesky':
      return `https://bsky.app/profile/${clean}`;
    case 'telegram':
      return `https://t.me/${clean}`;
    default:
      return value;
  }
}

/** The message for one social handle row, or undefined when it is fine or empty. */
function socialHandleIssue(row: EventFormSocialHandle): string | undefined {
  if (!row.handle.trim()) return undefined;
  if (!row.platform) return EVENT_FORM_TEXT.platformRequired;
  const address = normalizeSocialHandle(row.platform, row.handle);
  const valid = row.platform === 'email' ? isValidEmail(address) : isValidUrl(address);
  return valid ? undefined : EVENT_FORM_TEXT.handleInvalid;
}

/** Filled rows as addresses by platform. */
export function toContactInfos(rows: EventFormSocialHandle[]): EventContactInfos {
  const infos: EventContactInfos = {};
  rows.forEach((row) => {
    const address = row.platform ? normalizeSocialHandle(row.platform, row.handle) : '';
    if (address) infos[row.platform] = [...(infos[row.platform] ?? []), address];
  });
  return infos;
}

export function fromContactInfos(infos: unknown): EventFormSocialHandle[] {
  if (!infos || typeof infos !== 'object') return [];
  return Object.entries(infos as Record<string, unknown>).flatMap(([platform, handles]) =>
    (Array.isArray(handles) ? handles : [])
      .filter((handle): handle is string => typeof handle === 'string' && !!handle.trim())
      .map((handle) => ({ platform, handle })),
  );
}

/* ---------- Checks ---------- */

/** A description that holds no text ("<p><br></p>") is empty. */
export function descriptionText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/** The description's length as its counter shows it: the text with no tags. */
export function descriptionLength(html: string): number {
  return plainSpaces(html).replace(/<[^>]*>/g, '').length;
}

/**
 * The form's checks. "Submit Event", "Submit" and "Save Changes" run them all. "Save as draft" needs only the name,
 * the dates and the time zone, and still checks what is filled in: links, emails, social handles, the description's
 * length and the agenda.
 */
export function checkEventForm(values: EventFormValues, mode: EventFormMode): EventFormErrors {
  const errors: EventFormErrors = {};
  const submit = mode === 'submit';

  if (!values.name.trim()) errors.name = EVENT_FORM_TEXT.nameRequired;

  const instants = eventInstants(values);
  if (!values.startDay || !values.endDay) errors.dates = EVENT_FORM_TEXT.datesRequired;
  else if (instants && new Date(instants.end).getTime() < new Date(instants.start).getTime())
    errors.dates = EVENT_FORM_TEXT.endBeforeStart;
  if (!values.timezone) errors.timezone = EVENT_FORM_TEXT.timezoneRequired;

  if (descriptionLength(values.description) > EVENT_DESCRIPTION_MAX)
    errors.description = EVENT_FORM_TEXT.descriptionTooLong;

  if (submit && values.tags.length === 0) errors.tags = EVENT_FORM_TEXT.tagRequired;
  if (submit && !values.hostName.trim()) errors.hostName = EVENT_FORM_TEXT.hostRequired;

  const coHosts = values.coHosts.map((coHost) => {
    const issue: { name?: string; email?: string } = {};
    if (!coHost.name.trim()) issue.name = EVENT_FORM_TEXT.coHostNameRequired;
    if (coHost.email.trim() && !isValidEmail(coHost.email)) issue.email = EVENT_FORM_TEXT.emailInvalid;
    return issue.name || issue.email ? issue : undefined;
  });
  if (coHosts.some(Boolean)) errors.coHosts = coHosts;

  if (values.registrationUrl.trim() && !isValidUrl(values.registrationUrl))
    errors.registrationUrl = EVENT_FORM_TEXT.registrationInvalid;
  if (values.format !== 'IN_PERSON' && values.meetingUrl.trim() && !isValidUrl(values.meetingUrl))
    errors.meetingUrl = EVENT_FORM_TEXT.meetingInvalid;
  if (values.websiteUrl.trim() && !isValidUrl(values.websiteUrl)) errors.websiteUrl = EVENT_FORM_TEXT.websiteInvalid;

  const socialHandles = values.socialHandles.map(socialHandleIssue);
  if (socialHandles.some(Boolean)) errors.socialHandles = socialHandles;

  if (values.agenda?.sessions.length) {
    errors.agenda = instants
      ? (agendaIssue(values.agenda.sessions, instants.start, instants.end, values.timezone) ?? undefined)
      : EVENT_FORM_TEXT.agendaNeedsEventDates;
    if (!errors.agenda) delete errors.agenda;
  }

  return errors;
}

export const hasEventFormErrors = (errors: EventFormErrors) => Object.keys(errors).length > 0;

/* ---------- Form → body ---------- */

const orNull = (value: string) => value.trim() || null;

/**
 * The one mapping from form values to the request body. The format decides which location fields are sent: In Person
 * sends the venue, Online the meeting link, Hybrid both. `logoUid` is the uploaded or stored logo, null for none.
 */
export function toEventBody(values: EventFormValues, logoUid: string | null): EventBodyFields {
  const hasVenue = values.format !== 'VIRTUAL';
  const hasMeeting = values.format !== 'IN_PERSON';
  const venue = hasVenue ? values.venue.trim() : '';
  const place = venue ? values.place : null;

  return {
    name: values.name.trim(),
    description: descriptionText(values.description) ? plainSpaces(values.description) : '',
    startDate: toInstant(values.startDay, values.startTime, values.timezone),
    endDate: toInstant(values.endDay, values.endTime, values.timezone),
    timezone: values.timezone,
    allDay: false,
    format: values.format,
    accessOption: values.accessOption,
    tags: values.tags,
    hostName: orNull(values.hostName),
    hostEmail: orNull(values.hostEmail),
    coHosts: values.coHosts.map((coHost) => ({ name: coHost.name.trim(), email: orNull(coHost.email) })),
    websiteUrl: toHttpUrl(values.websiteUrl),
    registrationUrl: toHttpUrl(values.registrationUrl),
    meetingUrl: hasMeeting ? toHttpUrl(values.meetingUrl) : null,
    locationUrl: place?.locationUrl ?? null,
    contactInfos: toContactInfos(values.socialHandles),
    agenda: values.agenda?.sessions.length ? values.agenda : null,
    address: venue
      ? {
          address: venue,
          city: place?.city ?? null,
          state: place?.state ?? null,
          country: place?.country ?? null,
          latitude: place?.latitude ?? null,
          longitude: place?.longitude ?? null,
          locationInstructions: orNull(values.instruction),
        }
      : null,
    logoUid,
  };
}
