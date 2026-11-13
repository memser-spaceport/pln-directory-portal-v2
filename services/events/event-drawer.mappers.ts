import { formatInTimeZone } from 'date-fns-tz';

import type { EventRole, EventRoleSelection, Resource } from '@/components/core/UpdatesPanel/IrlGatheringModal/types';
import type {
  EventAccess,
  EventAgendaDay,
  EventAttendee,
  EventDetail,
  EventDetailResponse,
  EventDetailsResponse,
  EventMode,
  EventRoleName,
  EventRolesPayload,
  EventTag,
  MyGatheringPlans,
} from './event-drawer.types';

/*
 * Pure mapping from the BE's wire shapes to what the event drawer draws (LAB-3216).
 *
 * The events service sends `format`, `accessOption` and tag names as free strings, and never tag colours, so each is
 * normalised tolerantly here and left out when it can't be read.
 */

const FALLBACK_TIMEZONE = 'UTC';

/** The PL events app's fixed tag colours (icon, background). */
const DEFAULT_TAGS: Record<string, [string, string]> = {
  'industry event': ['#FF7A00', '#FFEDD5'],
  'pl event': ['#FFB800', '#FEF3C7'],
  workshop: ['#FF1493', '#FFD9EB'],
  'art exhibition': ['#00FF00', '#CCFFCC'],
  'social event': ['#87CEEB', '#D0E6FF'],
};

/** The PL events app's colour pairs for any other tag, picked by a hash of its name. Index 0 is never picked. */
const COLOR_PAIRS: [string, string][] = [
  ['#757575', '#7575751F'],
  ['#E53935', '#E539351F'],
  ['#3F51B5', '#3F51B51F'],
  ['#9C27B0', '#9C27B01F'],
  ['#00897B', '#00897B1F'],
  ['#00ACC1', '#00ACC11F'],
  ['#ACA84C', '#ACA84C1F'],
  ['#2196F3', '#2196F31F'],
  ['#FFC107', '#FFC1071F'],
  ['#FFEB3B', '#FFEB3B1F'],
  ['#4CAF50', '#4CAF501F'],
  ['#00C853', '#00C8531F'],
  ['#03A9F4', '#03A9F41F'],
  ['#9C27B0', '#9C27B01F'],
  ['#F50057', '#FDDCDC'],
  ['#FF4081', '#FF40811F'],
];

/** The events app's `stringToUniqueInteger`: a 32-bit string hash mapped to 1..15. */
export function tagColorIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return (((hash % 15) + 15) % 15) + 1;
}

export function toEventTag(name: string): EventTag {
  const fixed = DEFAULT_TAGS[name.trim().toLowerCase()];
  const [icon, background] = fixed ?? COLOR_PAIRS[tagColorIndex(name)];
  return { name, icon, background };
}

function normalizeKey(value: string | null | undefined): string {
  return (value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s_-]+/g, ' ');
}

/** "IN-PERSON", "IN_PERSON", "In person" → In-Person; unknown → null. Falls back to `PLEvent.type`. */
export function toEventMode(format: string | null | undefined, type?: string | null): EventMode | null {
  for (const raw of [format, type]) {
    const key = normalizeKey(raw).replace(/ /g, '');
    if (key === 'INPERSON') return 'In-Person';
    if (key === 'VIRTUAL' || key === 'ONLINE') return 'Virtual';
    if (key === 'HYBRID') return 'Hybrid';
  }
  return null;
}

/** "PAID" → PAID, "OPEN" / "FREE…" → FREE w/ RSVP, "INVITE…" → INVITE ONLY; unknown → null. */
export function toEventAccess(
  accessOption: string | null | undefined,
  accessType?: string | null,
  type?: string | null,
): EventAccess | null {
  for (const raw of [accessOption, accessType]) {
    const key = normalizeKey(raw);
    if (!key) continue;
    if (key === 'PAID') return 'PAID';
    if (key === 'OPEN' || key.startsWith('FREE')) return 'FREE w/ RSVP';
    if (key.startsWith('INVITE')) return 'INVITE ONLY';
  }
  return normalizeKey(type) === 'INVITE ONLY' ? 'INVITE ONLY' : null;
}

function safeTimezone(timezone: string | null | undefined): string {
  if (!timezone) return FALLBACK_TIMEZONE;
  try {
    formatInTimeZone(new Date(0), timezone, 'xxx');
    return timezone;
  } catch {
    return FALLBACK_TIMEZONE;
  }
}

function isValidDate(value: unknown): value is string | number {
  if (typeof value !== 'string' && typeof value !== 'number') return false;
  return !Number.isNaN(new Date(value).getTime());
}

/** "-05:00" → "-5:00", "+00:00" → "+0:00", as the events app prints it. */
function utcOffset(date: Date, timezone: string): string {
  const raw = formatInTimeZone(date, timezone, 'xxx');
  const match = /^([+-])0?(\d{1,2}):(\d{2})$/.exec(raw);
  return match ? `${match[1]}${match[2]}:${match[3]}` : raw;
}

/** "19th Nov 2026, 18:00 - 19th Nov 2026, 21:00 (UTC -5:00)". */
export function formatEventDateLine(startDate: string, endDate: string, timezone: string): string {
  if (!isValidDate(startDate)) return '';
  const tz = safeTimezone(timezone);
  const start = new Date(startDate);
  const pattern = 'do MMM yyyy, HH:mm';
  const startText = formatInTimeZone(start, tz, pattern);
  const endText = isValidDate(endDate) ? ` - ${formatInTimeZone(new Date(endDate), tz, pattern)}` : '';
  return `${startText}${endText} (UTC ${utcOffset(start, tz)})`;
}

interface AgendaSession {
  name: string;
  start: Date;
  end: Date | null;
  description: string | null;
}

function readSession(raw: unknown): AgendaSession | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Record<string, unknown>;
  const name = typeof s.name === 'string' ? s.name.trim() : typeof s.title === 'string' ? s.title.trim() : '';
  const start = s.start_date ?? s.startDate;
  const end = s.end_date ?? s.endDate;
  if (!name || !isValidDate(start)) return null;
  const description = typeof s.description === 'string' && s.description.trim() ? s.description.trim() : null;
  return { name, start: new Date(start), end: isValidDate(end) ? new Date(end) : null, description };
}

/**
 * The events app's agenda: sessions grouped by their start day in the event's timezone, "Day N - 19th Nov Thu",
 * each "6:00 PM - 6:45 PM • name" with its description under it.
 */
export function toAgendaDays(agenda: EventDetailsResponse['agenda'], timezone: string): EventAgendaDay[] {
  const sessions = Array.isArray(agenda?.sessions) ? agenda.sessions : [];
  const tz = safeTimezone(timezone);
  const parsed = sessions
    .map(readSession)
    .filter((s): s is AgendaSession => !!s)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const days: { key: string; label: string; items: EventAgendaDay['items'] }[] = [];
  for (const session of parsed) {
    const key = formatInTimeZone(session.start, tz, 'yyyy-MM-dd');
    let day = days.find((d) => d.key === key);
    if (!day) {
      day = { key, label: `Day ${days.length + 1} - ${formatInTimeZone(session.start, tz, 'do MMM EEE')}`, items: [] };
      days.push(day);
    }
    const startTime = formatInTimeZone(session.start, tz, 'h:mm a');
    const time = session.end ? `${startTime} - ${formatInTimeZone(session.end, tz, 'h:mm a')}` : startTime;
    day.items.push({ time, title: session.name, ...(session.description ? { about: session.description } : {}) });
  }
  return days.map((d) => ({ day: d.label, items: d.items }));
}

function toResource(raw: unknown): Resource | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const link = typeof r.link === 'string' ? r.link.trim() : '';
  if (!link) return null;
  return {
    link,
    name: typeof r.name === 'string' && r.name.trim() ? r.name.trim() : link,
    type: r.type === 'custom' ? 'custom' : 'social',
    isPublic: r.isPublic === false || r.isPublic === 'false' ? 'false' : 'true',
    description: typeof r.description === 'string' ? r.description : null,
    ...(typeof r.icon === 'string' ? { icon: r.icon } : {}),
  };
}

function uniqueNames(names: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of names) {
    const name = raw?.trim();
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    out.push(name);
  }
  return out;
}

function cityOf(location: string): string {
  return location.split(',')[0]?.trim() || location;
}

export function toEventDetail(raw: EventDetailResponse): EventDetail {
  const details = raw.details;
  const timezone = safeTimezone(raw.location?.timezone);
  const partyHosts = uniqueNames([details?.host?.name, ...(details?.coHosts ?? []).map((h) => h.name)]);
  const hosts = partyHosts.length ? partyHosts : uniqueNames((raw.hosts ?? []).map((h) => h.name));
  const tags = uniqueNames((details?.tags ?? []).map((t) => t.name)).map(toEventTag);

  return {
    uid: raw.uid,
    name: raw.name,
    startDate: raw.startDate,
    endDate: raw.endDate,
    timezone,
    mode: toEventMode(details?.format, raw.type),
    access: toEventAccess(details?.accessOption, details?.accessType, raw.type),
    dateLine: formatEventDateLine(raw.startDate, raw.endDate, timezone),
    address: raw.location?.location?.trim() || null,
    image: raw.logo || raw.banner || null,
    tags,
    hosts,
    description: raw.description?.trim() || raw.shortDescription?.trim() || null,
    agenda: toAgendaDays(details?.agenda ?? null, timezone),
    websiteUrl: raw.websiteUrl,
    gathering: raw.location
      ? {
          uid: raw.location.uid,
          location: raw.location.location,
          city: raw.location.city?.trim() || cityOf(raw.location.location),
          timezone,
          resources: (raw.location.resources ?? []).map(toResource).filter((r): r is Resource => !!r),
          events: (raw.location.events ?? []).map(({ uid, name, startDate, endDate }) => ({
            uid,
            name,
            startDate,
            endDate,
          })),
        }
      : null,
    goingCount: raw.goingCount ?? 0,
    faces: (raw.faces ?? []).slice(0, 3),
    viewer: raw.viewerGoing && raw.viewer ? raw.viewer : null,
  };
}

/** A guests-list row (`GET /v1/irl/locations/:uid/guests?eventUid=`), as `transformMembers` reads it. */
export function toEventAttendee(raw: any, eventUid: string): EventAttendee {
  const teamUid: string | undefined = raw?.team?.uid ?? raw?.teamUid;
  const memberships: any[] = [...(raw?.member?.teamMemberRoles ?? []), ...(raw?.teamMemberRoles ?? [])];
  const membership = memberships.find((tm) => (tm?.team?.uid ?? tm?.teamUid) === teamUid) ?? null;
  const event = (raw?.events ?? []).find((e: any) => e?.uid === eventUid);
  const roles: EventRoleName[] = [];
  if (event?.isHost) roles.push('Host');
  if (event?.isSpeaker) roles.push('Speaker');
  if (event?.isSponsor) roles.push('Sponsor');

  return {
    memberUid: raw?.memberUid ?? raw?.member?.uid ?? '',
    name: raw?.member?.name ?? '',
    image: raw?.member?.image?.url || null,
    role: membership?.role?.trim() || null,
    teamName: raw?.team?.name ?? membership?.team?.name ?? null,
    roles,
  };
}

const ROLE_ORDER: EventRole[] = ['Attendee', 'Speaker', 'Host', 'Sponsor'];

/** The caller's own rows at a gathering (`GET /v1/irl/locations/:uid/guests/:memberUid?type=upcoming`). */
export function toMyGatheringPlans(rows: unknown): MyGatheringPlans {
  const list: any[] = Array.isArray(rows) ? rows : [];
  const first = list[0] ?? {};
  const eventRows = list.filter((r) => r?.event?.uid ?? r?.eventUid);
  const eventUids = Array.from(new Set(eventRows.map((r) => (r.event?.uid ?? r.eventUid) as string)));
  const eventRoles: EventRoleSelection[] = eventUids.map((uid) => {
    const row = eventRows.find((r) => (r.event?.uid ?? r.eventUid) === uid);
    const roles = ROLE_ORDER.filter(
      (role) =>
        role === 'Attendee' ||
        (role === 'Host' && row?.isHost) ||
        (role === 'Speaker' && row?.isSpeaker) ||
        (role === 'Sponsor' && row?.isSponsor),
    );
    return { eventUid: uid, roles: roles.length > 1 ? roles.filter((r) => r !== 'Attendee') : roles };
  });

  return {
    eventUids,
    eventRoles,
    topics: Array.isArray(first.topics) ? first.topics : [],
    reason: typeof first.reason === 'string' ? first.reason : '',
    teamUid: first.teamUid || first.team?.uid || null,
    checkInDate: first.additionalInfo?.checkInDate || null,
    checkOutDate: first.additionalInfo?.checkOutDate || null,
    telegramId: first.telegramId || first.member?.telegramHandler || null,
    officeHours: first.officeHours || first.member?.officeHours || null,
  };
}

export const EMPTY_PLANS: MyGatheringPlans = {
  eventUids: [],
  eventRoles: [],
  topics: [],
  reason: '',
  teamUid: null,
  checkInDate: null,
  checkOutDate: null,
  telegramId: null,
  officeHours: null,
};

export function toEventRolesPayload(eventUid: string, roles: EventRole[] = []): EventRolesPayload {
  return {
    uid: eventUid,
    isHost: roles.includes('Host'),
    isSpeaker: roles.includes('Speaker'),
    isSponsor: roles.includes('Sponsor'),
  };
}
