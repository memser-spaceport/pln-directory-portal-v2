import { customFetch } from '@/utils/fetch-wrapper';

import type { EventDetailResponse } from './event-drawer.types';
import type {
  EventAgendaSession,
  EventWriteResult,
  LumaEvent,
  MyEventResponse,
  ParsedAgenda,
  PlaceSuggestion,
  ResolvedPlace,
  SubmitEventBody,
  UpdateEventBody,
} from './event-submission.types';

/*
 * The calls behind the submit form, the edit page and My Submissions, against the routes under `/v1/irl/events`.
 *
 * A signed-in call goes through `customFetch` with the token. A signed-out visitor can submit and use the form's
 * lookups too, so those calls take `withAuth` and go without a token when it is false. Every failure throws an
 * `EventRequestError` that carries the status, so the form can tell "too many submissions" (429) from the rest.
 */

const api = () => process.env.DIRECTORY_API_URL;

const JSON_HEADERS = { 'Content-Type': 'application/json' };

/** A failed call: the HTTP status (null when the request never got an answer) and the API's message. */
export class EventRequestError extends Error {
  constructor(
    readonly status: number | null,
    message: string,
  ) {
    super(message);
    this.name = 'EventRequestError';
  }
}

async function messageOf(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json();
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    return typeof message === 'string' && message.trim() ? message : fallback;
  } catch {
    return fallback;
  }
}

/** One request; the parsed body on success, an `EventRequestError` otherwise (also when the network fails). */
async function request<T>(path: string, init: RequestInit, withAuth: boolean, fallback: string): Promise<T> {
  let response: Response | undefined;
  try {
    response = await customFetch(`${api()}${path}`, { cache: 'no-store', ...init }, withAuth);
  } catch {
    throw new EventRequestError(null, fallback);
  }
  if (!response) throw new EventRequestError(null, fallback);
  if (!response.ok) throw new EventRequestError(response.status, await messageOf(response, fallback));
  if (response.status === 204) return undefined as T;
  try {
    return (await response.json()) as T;
  } catch {
    return undefined as T;
  }
}

const eventPath = (uid: string) => `/v1/irl/events/${encodeURIComponent(uid)}`;

/** `POST /v1/irl/events`: 201 with the event and the status the backend gave it (`APPROVED`, `PENDING`, `DRAFT`). */
export function submitEvent(body: SubmitEventBody, withAuth: boolean): Promise<EventWriteResult> {
  return request<EventWriteResult>(
    '/v1/irl/events',
    { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(body) },
    withAuth,
    'Failed to submit the event',
  );
}

/** `PATCH /v1/irl/events/:uid`. `submit: true` sends a draft for publishing; any other edit keeps the status. */
export function updateEvent(uid: string, body: UpdateEventBody): Promise<EventWriteResult> {
  return request<EventWriteResult>(
    eventPath(uid),
    { method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify(body) },
    true,
    'Failed to update the event',
  );
}

/** `DELETE /v1/irl/events/:uid`. */
export async function deleteEvent(uid: string): Promise<void> {
  await request<unknown>(eventPath(uid), { method: 'DELETE' }, true, 'Failed to delete the event');
}

/** `GET /v1/irl/events/mine`: the member's own events of every status, newest first. */
export async function getMyEvents(): Promise<MyEventResponse[]> {
  const body = await request<MyEventResponse[] | { items?: MyEventResponse[] }>(
    '/v1/irl/events/mine',
    { method: 'GET' },
    true,
    'Failed to load your events',
  );
  if (Array.isArray(body)) return body;
  return Array.isArray(body?.items) ? body.items : [];
}

/**
 * `GET /v1/irl/events/:uid` with the member's token, for the edit page: the backend returns an event that is not
 * approved to its submitter and a directory admin only. `null` when it answers 404.
 */
export async function getEventForEdit(uid: string): Promise<EventDetailResponse | null> {
  try {
    return await request<EventDetailResponse>(eventPath(uid), { method: 'GET' }, true, 'Failed to load the event');
  } catch (error) {
    if (error instanceof EventRequestError && error.status === 404) return null;
    throw error;
  }
}

/** `GET /v1/irl/events/places?query=`: up to 5 venue suggestions. An empty query asks nothing. */
export async function searchPlaces(query: string, withAuth: boolean): Promise<PlaceSuggestion[]> {
  const text = query.trim();
  if (!text) return [];
  const body = await request<PlaceSuggestion[] | { items?: PlaceSuggestion[] }>(
    `/v1/irl/events/places?query=${encodeURIComponent(text)}`,
    { method: 'GET' },
    withAuth,
    'Failed to look up places',
  );
  const items = Array.isArray(body) ? body : (body?.items ?? []);
  return items.filter((item) => item?.text && item?.placeId);
}

/** `GET /v1/irl/events/places/resolve`: a place by its id, or by the text a person typed. `null` for no match. */
export async function resolvePlace(
  place: { placeId: string } | { address: string },
  withAuth: boolean,
): Promise<ResolvedPlace | null> {
  const params = new URLSearchParams(place);
  try {
    return await request<ResolvedPlace>(
      `/v1/irl/events/places/resolve?${params.toString()}`,
      { method: 'GET' },
      withAuth,
      'Failed to resolve the place',
    );
  } catch (error) {
    if (error instanceof EventRequestError && error.status === 404) return null;
    throw error;
  }
}

/** A session as the parser may send it: instants under `start_date` / `end_date` or `startDate` / `endDate`. */
type RawSession = Partial<EventAgendaSession> & { startDate?: string; endDate?: string };

/** `POST /v1/irl/events/agenda/parse`: agenda text as sessions, or a message that says what is missing. */
export async function parseAgenda(
  input: { text: string; startDate: string; endDate: string; timezone: string },
  withAuth: boolean,
): Promise<ParsedAgenda> {
  const body = await request<{ sessions?: RawSession[]; message?: string | null }>(
    '/v1/irl/events/agenda/parse',
    { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(input) },
    withAuth,
    'Failed to read the agenda',
  );
  const sessions = (body?.sessions ?? []).flatMap((session) => {
    const start = session.start_date ?? session.startDate;
    const end = session.end_date ?? session.endDate;
    if (!session.name || !start || !end) return [];
    return [
      {
        name: session.name,
        description: session.description ?? null,
        start_date: start,
        end_date: end,
        timezone: input.timezone,
      },
    ];
  });
  return { sessions, message: body?.message?.trim() || null };
}

/** `GET /v1/irl/events/import/luma?url=`: a Luma event, ready for the form. Nothing is stored. */
export function importFromLuma(url: string, withAuth: boolean): Promise<LumaEvent> {
  return request<LumaEvent>(
    `/v1/irl/events/import/luma?url=${encodeURIComponent(url)}`,
    { method: 'GET' },
    withAuth,
    'Failed to import from Luma',
  );
}

/** `POST /v1/images`: the logo, uploaded when the form is sent. Returns the stored image's uid. */
export async function uploadEventLogo(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  let response: Response;
  try {
    response = await fetch(`${api()}/v1/images`, { method: 'POST', body: formData });
  } catch {
    throw new EventRequestError(null, 'Failed to upload the logo');
  }
  if (!response.ok) throw new EventRequestError(response.status, 'Failed to upload the logo');
  const body = await response.json();
  const uid = body?.image?.uid ?? body?.uid;
  if (typeof uid !== 'string' || !uid) throw new EventRequestError(null, 'Failed to upload the logo');
  return uid;
}
