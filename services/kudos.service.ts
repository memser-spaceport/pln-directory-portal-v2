/**
 * Community Kudos (Lite) service — thin HTTP wrapper.
 *
 * One function per API endpoint documented in KUDOS-BACKEND-SPEC.md.
 * The TanStack Query hooks in `@/hooks/use-kudos` import these directly.
 *
 * PRIVACY: every endpoint here is authenticated. The recipient list and the
 * feed return only safe user summaries (memberId, name, optional avatar) —
 * never email or private directory fields. The recipient list is NOT bundled
 * in the frontend; it is fetched from the backend at runtime.
 *
 * Auth + base URL follow the repo's existing PLAA integration: the browser
 * calls the local `/api/plaa/*` Next route handlers (which forward to
 * `PLAA_API_URL` server-side, see `app/api/plaa/kudos/*`), attaching the Privy
 * session token from the `authToken` cookie — the same pattern as
 * `services/points/hooks/usePoints.ts`.
 */

import { getCookiesFromClient } from '@/utils/third-party.helper';
import type {
  ICommunityKudos,
  IKudosFeedPage,
  ICommunityPool,
  ICommunityKudosInput,
  IUserSummary,
} from '@/components/page/aligement-assets/kudos-board/data/kudos-board.types';

// The client hits the local proxy routes; those append `/api/v1/kudos/...` onto
// PLAA_API_URL server-side, so no plaa-service origin is exposed to the browser.
const API_BASE = process.env.NEXT_PUBLIC_KUDOS_API_BASE ?? '/api/plaa';

async function getAuthHeaders(): Promise<HeadersInit> {
  const { authToken } = getCookiesFromClient();
  return {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = { ...(await getAuthHeaders()), ...(init?.headers ?? {}) };
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    throw new KudosApiError(res.status, errorBody || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export class KudosApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'KudosApiError';
  }
}

/* --------------------------------------------------------------------------
   Read
   -------------------------------------------------------------------------- */

export interface IGetKudosFeedParams {
  roundId: string;
  limit?: number;
  cursor?: string;
}

/**
 * Shared board — persistent across rounds, newest first. The current round is
 * resolved server-side, so no round id is sent; `roundId` stays a client-side
 * cache key only.
 */
export function getKudosFeed(params: IGetKudosFeedParams): Promise<IKudosFeedPage> {
  const qs = new URLSearchParams();
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.cursor) qs.set('cursor', params.cursor);
  const query = qs.toString();
  return request<IKudosFeedPage>(`/kudos${query ? `?${query}` : ''}`);
}

/**
 * The signed-in user's community pool. The server scopes it to the caller and
 * the current round; the `roundId` argument is the cache key, not a filter.
 */
export function getCommunityPool(_roundId: string): Promise<ICommunityPool> {
  return request<ICommunityPool>(`/kudos/community-pool`);
}

/**
 * Active member directory for the recipient picker. Authenticated only.
 * Returns safe user summaries; the signed-in user is excluded server-side.
 * This replaces any hardcoded/bundled member list in the frontend.
 */
export function getRecipients(): Promise<{ items: IUserSummary[] }> {
  return request<{ items: IUserSummary[] }>(`/kudos/recipients`);
}

/* --------------------------------------------------------------------------
   Submit
   -------------------------------------------------------------------------- */

/**
 * Give a community kudos. The giver is resolved from the authenticated session
 * server-side — never sent from the client. Awarded immediately on success.
 */
export function submitCommunityKudos(input: ICommunityKudosInput): Promise<ICommunityKudos> {
  return request<ICommunityKudos>('/kudos/community', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
