import type {
  MemberProfileEvent,
  ProfileEventFields,
  ProfileEventPerson,
  ProfileEventRole,
  ProfileEventsGroup,
  ProfileEventsQuery,
  TeamPastEvent,
  TeamProfileDemoDay,
  TeamProfileEvent,
} from './profile-events.types';

/*
 * The profile Events sections' reads (LAB-3217, LAB-3219), against BE LAB-3215.
 *
 * Server-safe on purpose: plain `fetch`, no cookies, no toasts. The member and team pages' server renders call
 * `getMemberEventsPublic` / `getTeamEventsPublic` without a token (design D5); the browser's signed-in reads live in
 * `useMemberEvents` / `useTeamEvents`.
 */

/** One request carries every card a group can show, so "Show all N" expands in place without another round trip. */
export const PROFILE_EVENTS_FETCH_LIMIT = 50;

function profileEventsUrl(path: 'members' | 'teams', uid: string, query: ProfileEventsQuery): string {
  const params = new URLSearchParams();
  if (query.group) params.set('group', query.group);
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  const search = params.toString();
  return `${process.env.DIRECTORY_API_URL}/v1/${path}/${encodeURIComponent(uid)}/events${search ? `?${search}` : ''}`;
}

export function memberEventsUrl(memberUid: string, query: ProfileEventsQuery = {}): string {
  return profileEventsUrl('members', memberUid, query);
}

export function teamEventsUrl(teamUid: string, query: ProfileEventsQuery = {}): string {
  return profileEventsUrl('teams', teamUid, query);
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

const count = (value: unknown): number => (typeof value === 'number' && value >= 0 ? Math.floor(value) : 0);

const toPeople = (value: unknown): ProfileEventPerson[] =>
  Array.isArray(value)
    ? value
        .map(toPerson)
        .filter((person): person is ProfileEventPerson => !!person)
        .slice(0, 3)
    : [];

/** The fields every event card draws; `null` when the item can't be drawn (no uid, name or valid start). */
function toEventFields(value: Record<string, unknown>): ProfileEventFields | null {
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
    goingCount: count(value.goingCount),
    faces: toPeople(value.faces),
    viewerGoing: value.viewerGoing === true,
  };
}

function toMemberEvent(value: unknown): MemberProfileEvent | null {
  if (!isRecord(value)) return null;
  const fields = toEventFields(value);
  return fields && { ...fields, showOnProfile: value.showOnProfile !== false };
}

function toTeamEvent(value: unknown): TeamProfileEvent | null {
  if (!isRecord(value)) return null;
  const fields = toEventFields(value);
  if (!fields) return null;
  const members = toPeople(value.members);
  return { ...fields, members, memberCount: Math.max(count(value.memberCount), members.length) };
}

function toDemoDay(value: Record<string, unknown>): TeamProfileDemoDay | null {
  const uid = str(value.uid);
  const title = str(value.title);
  const slug = str(value.slug);
  const startDate = str(value.startDate);
  if (!uid || !title || !slug || !startDate || Number.isNaN(Date.parse(startDate))) return null;
  const endDate = str(value.endDate) ?? startDate;
  return {
    kind: 'demo-day',
    uid,
    title,
    slug,
    startDate,
    endDate: Number.isNaN(Date.parse(endDate)) ? startDate : endDate,
  };
}

function toTeamPastItem(value: unknown): TeamProfileDemoDay | TeamPastEvent | null {
  if (!isRecord(value)) return null;
  return value.kind === 'demo-day' ? toDemoDay(value) : toEventFields(value);
}

function toGroup<T>(value: unknown, toItem: (item: unknown) => T | null): ProfileEventsGroup<T> | null {
  if (!isRecord(value) || !Array.isArray(value.items)) return null;
  const items = value.items.map(toItem).filter((item): item is T => !!item);
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
  const upcoming = toGroup(json.upcoming, toMemberEvent);
  const past = toGroup(json.past, toMemberEvent);
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

/** Both groups of a team's events, cleaned. A group the response left out is `null`. */
export interface TeamEvents {
  upcoming: ProfileEventsGroup<TeamProfileEvent> | null;
  /** Demo Days first, as the BE orders them, then the team's past events. */
  past: ProfileEventsGroup<TeamProfileDemoDay | TeamPastEvent> | null;
}

/** `normalizeMemberEvents` for `GET /v1/teams/:uid/events`: same rules, Demo Day items kept as their own kind. */
export function normalizeTeamEvents(json: unknown): TeamEvents | null {
  if (!isRecord(json)) return null;
  const upcoming = toGroup(json.upcoming, toTeamEvent);
  const past = toGroup(json.past, toTeamPastItem);
  if (!upcoming && !past) return null;
  return { upcoming, past };
}

/**
 * The team's events as a signed-out visitor sees them (past and Demo Days), for the server render (design D5). No
 * token, so the server HTML can't carry its members' upcoming plans. `null` on any failure, a 403 or 404 included: the
 * section is then left out of the server HTML.
 */
export async function getTeamEventsPublic(teamUid: string): Promise<TeamEvents | null> {
  try {
    const response = await fetch(teamEventsUrl(teamUid, { group: 'past', limit: PROFILE_EVENTS_FETCH_LIMIT }), {
      method: 'GET',
      cache: 'no-store',
    });
    if (!response.ok) return null;
    const events = normalizeTeamEvents(await response.json());
    return events && { upcoming: null, past: events.past };
  } catch {
    return null;
  }
}
