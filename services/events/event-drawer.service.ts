import { customFetch } from '@/utils/fetch-wrapper';

import { toEventAttendee, toMyGatheringPlans } from './event-drawer.mappers';
import type {
  CreateEventAttendancePayload,
  EventAttendeesPage,
  EventDetailResponse,
  MyGatheringPlans,
  UpdateMyPlansPayload,
} from './event-drawer.types';

/*
 * The event drawer's calls (LAB-3216), against the BE routes of LAB-3211 (LAB-3213).
 *
 * Reads that need a viewer go through `customFetch` with the token; callers gate them on a current user so its
 * reload-on-401 can't loop. Writes throw an `Error` carrying the API's message, for the drawer's error toast.
 */

const api = () => process.env.DIRECTORY_API_URL;

const JSON_HEADERS = { 'Content-Type': 'application/json' };

async function errorMessage(response: Response | undefined, fallback: string): Promise<string> {
  if (!response) return fallback;
  try {
    const body = await response.json();
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    return typeof message === 'string' && message.trim() ? message : fallback;
  } catch {
    return fallback;
  }
}

/** Thrown by `getEventDetail` when the request failed for any reason but a missing event. */
export class EventDetailError extends Error {
  constructor(readonly status: number | null) {
    super(`Failed to load the event${status ? ` (${status})` : ''}`);
    this.name = 'EventDetailError';
  }
}

/** `GET /v1/irl/events/:uid`. `null` when the event doesn't exist or was deleted (404). */
export async function getEventDetail(eventUid: string, withAuth: boolean): Promise<EventDetailResponse | null> {
  const response: Response | undefined = await customFetch(
    `${api()}/v1/irl/events/${encodeURIComponent(eventUid)}`,
    { method: 'GET', cache: 'no-store' },
    withAuth,
  );
  if (response?.status === 404) return null;
  if (!response?.ok) throw new EventDetailError(response?.status ?? null);
  return (await response.json()) as EventDetailResponse;
}

export function eventAttendeesUrl({
  locationUid,
  eventUid,
  search,
  page,
  limit,
}: {
  locationUid: string;
  eventUid: string;
  search: string;
  page: number;
  limit: number;
}): string {
  const params = new URLSearchParams({ eventUid, page: String(page), limit: String(limit) });
  const needle = search.trim();
  if (needle) params.set('search', needle);
  return `${api()}/v1/irl/locations/${encodeURIComponent(locationUid)}/guests?${params.toString()}`;
}

/**
 * The attendees of exactly one event (`?eventUid=`, LAB-3213): no gathering-level guests, the viewer's own row
 * first, search by member, team or project name. No `type`, so a past event's list works too.
 */
export async function getEventAttendees(args: {
  locationUid: string;
  eventUid: string;
  search: string;
  page: number;
  limit: number;
  withAuth: boolean;
}): Promise<EventAttendeesPage> {
  const response: Response | undefined = await customFetch(
    eventAttendeesUrl(args),
    { method: 'GET', cache: 'no-store' },
    args.withAuth,
  );
  if (!response?.ok) throw new Error('Failed to load the attendees');
  const rows = await response.json();
  const list: any[] = Array.isArray(rows) ? rows : [];
  return {
    rows: list.map((row) => toEventAttendee(row, args.eventUid)),
    total: Number(list[0]?.count ?? 0) || 0,
    page: args.page,
  };
}

/** The caller's own rows at a gathering, for the plans step. A non-admin always gets their own rows. */
export async function getMyGatheringPlans(locationUid: string, memberUid: string): Promise<MyGatheringPlans> {
  const response: Response | undefined = await customFetch(
    `${api()}/v1/irl/locations/${encodeURIComponent(locationUid)}/guests/${encodeURIComponent(memberUid)}?type=upcoming`,
    { method: 'GET', cache: 'no-store' },
    true,
  );
  if (!response?.ok) throw new Error('Failed to load your plans');
  return toMyGatheringPlans(await response.json());
}

/** "Yes, I'm going" and events added in the plans step: creates one row per event, never touches the others. */
export async function createEventAttendance(locationUid: string, payload: CreateEventAttendancePayload) {
  const response: Response | undefined = await customFetch(
    `${api()}/v1/irl/locations/${encodeURIComponent(locationUid)}/guests?type=upcoming`,
    { method: 'POST', cache: 'no-store', headers: JSON_HEADERS, body: JSON.stringify(payload) },
    true,
  );
  if (!response?.ok) throw new Error(await errorMessage(response, 'Failed to save that you are going'));
}

/** "Not going" for these events only. Never sends `events: []`, which deletes every row at the gathering. */
export async function removeEventAttendance(locationUid: string, memberUid: string, eventUids: string[]) {
  if (!eventUids.length) return;
  const response: Response | undefined = await customFetch(
    `${api()}/v1/irl/locations/${encodeURIComponent(locationUid)}/events/guests`,
    {
      method: 'POST',
      cache: 'no-store',
      headers: JSON_HEADERS,
      body: JSON.stringify({ membersAndEvents: [{ memberUid, events: eventUids }] }),
    },
    true,
  );
  if (!response?.ok) throw new Error(await errorMessage(response, 'Failed to remove the event'));
}

/** `PATCH /v1/irl/locations/:uid/guests/me`: roles of kept events and the shared details, in place. */
export async function updateMyGatheringPlans(locationUid: string, payload: UpdateMyPlansPayload) {
  const response: Response | undefined = await customFetch(
    `${api()}/v1/irl/locations/${encodeURIComponent(locationUid)}/guests/me`,
    { method: 'PATCH', cache: 'no-store', headers: JSON_HEADERS, body: JSON.stringify(payload) },
    true,
  );
  if (!response?.ok) throw new Error(await errorMessage(response, 'Failed to save your plans'));
}
