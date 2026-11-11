import type {
  MemberEventsResponse,
  MemberProfileEvent,
  ProfileEventPerson,
  ProfileEventRole,
  ProfileEventsGroup,
  ProfileEventsQuery,
} from './profile-events.types';

/*
 * The profile Events sections' reads (LAB-3217), against BE LAB-3215.
 *
 * Server-safe on purpose: plain `fetch`, no cookies, no toasts. The member page's server render calls
 * `getMemberEventsPublic` without a token (design D5); the browser's signed-in read lives in `useMemberEvents`.
 */

/** One request carries every card a group can show, so "Show all N" expands in place without another round trip. */
export const PROFILE_EVENTS_FETCH_LIMIT = 50;

export function memberEventsUrl(memberUid: string, query: ProfileEventsQuery = {}): string {
  const params = new URLSearchParams();
  if (query.group) params.set('group', query.group);
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  const search = params.toString();
  return `${process.env.DIRECTORY_API_URL}/v1/members/${encodeURIComponent(memberUid)}/events${search ? `?${search}` : ''}`;
}

/** Both groups of a member's events, cleaned. A group the response left out is `null`. */
export interface MemberEvents {
  upcoming: ProfileEventsGroup<MemberProfileEvent> | null;
  past: ProfileEventsGroup<MemberProfileEvent> | null;
}

const ROLES: readonly ProfileEventRole[] = ['Host', 'Speaker', 'Sponsor'];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const str = (value: unknown): string | null => (typeof value === 'string' && value.trim() ? value : null);

function toPerson(value: unknown): ProfileEventPerson | null {
  if (!isRecord(value)) return null;
  const uid = str(value.uid);
  if (!uid) return null;
  return { uid, name: str(value.name) ?? '', image: str(value.image) };
}

function toMemberEvent(value: unknown): MemberProfileEvent | null {
  if (!isRecord(value)) return null;
  const uid = str(value.uid);
  const name = str(value.name);
  const startDate = str(value.startDate);
  if (!uid || !name || !startDate || Number.isNaN(Date.parse(startDate))) return null;
  const endDate = str(value.endDate) ?? startDate;

  return {
    kind: 'event',
    uid,
    name,
    type: str(value.type),
    startDate,
    endDate: Number.isNaN(Date.parse(endDate)) ? startDate : endDate,
    logo: str(value.logo),
    locationUid: str(value.locationUid),
    location: str(value.location),
    city: str(value.city),
    roles: Array.isArray(value.roles) ? ROLES.filter((role) => (value.roles as unknown[]).includes(role)) : [],
    goingCount: typeof value.goingCount === 'number' && value.goingCount >= 0 ? Math.floor(value.goingCount) : 0,
    faces: Array.isArray(value.faces)
      ? value.faces
          .map(toPerson)
          .filter((person): person is ProfileEventPerson => !!person)
          .slice(0, 3)
      : [],
    viewerGoing: value.viewerGoing === true,
    showOnProfile: value.showOnProfile !== false,
  };
}

function toGroup(value: unknown): ProfileEventsGroup<MemberProfileEvent> | null {
  if (!isRecord(value) || !Array.isArray(value.items)) return null;
  const items = value.items.map(toMemberEvent).filter((event): event is MemberProfileEvent => !!event);
  const total = typeof value.total === 'number' && value.total >= items.length ? Math.floor(value.total) : items.length;
  return {
    page: typeof value.page === 'number' ? value.page : 1,
    limit: typeof value.limit === 'number' ? value.limit : items.length,
    total,
    items,
  };
}

/**
 * The response as the section draws it: malformed items dropped, every field defaulted. `null` when neither group is
 * there (an error body, or anything else that isn't this endpoint's answer), so callers fall back rather than draw an
 * empty section. Idempotent, so it also cleans data that's already been through it.
 */
export function normalizeMemberEvents(json: unknown): MemberEvents | null {
  if (!isRecord(json)) return null;
  const upcoming = toGroup(json.upcoming);
  const past = toGroup(json.past);
  if (!upcoming && !past) return null;
  return { upcoming, past };
}

/**
 * The member's events as a signed-out visitor sees them (past only), for the server render (design D5). No token, so
 * the server HTML can't carry upcoming plans. `null` on any failure: the section is then left out of the server HTML.
 */
export async function getMemberEventsPublic(memberUid: string): Promise<MemberEvents | null> {
  try {
    const response = await fetch(memberEventsUrl(memberUid, { group: 'past', limit: PROFILE_EVENTS_FETCH_LIMIT }), {
      method: 'GET',
      cache: 'no-store',
    });
    if (!response.ok) return null;
    const events = normalizeMemberEvents(await response.json());
    return events && { upcoming: null, past: events.past };
  } catch {
    return null;
  }
}
