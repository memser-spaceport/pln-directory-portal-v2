import { getCookiesFromClient } from '@/utils/third-party.helper';
import type {
  ICommunityKudos,
  IKudosFeedPage,
  ICommunityPool,
  ICommunityKudosInput,
  IUserSummary,
} from '@/components/page/aligement-assets/kudos-board/data/kudos-board.types';

const API_BASE = process.env.NEXT_PUBLIC_KUDOS_API_BASE ?? '/api/plaa';

async function getAuthHeaders(): Promise<HeadersInit> {
  const { authToken } = getCookiesFromClient();
  const token = authToken || undefined;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** Nest sends `{ statusCode, message }`, the proxy routes send `{ error }`. */
function extractErrorMessage(body: string, fallback: string): string {
  if (!body) return fallback;
  try {
    const parsed = JSON.parse(body);
    const message = parsed?.message ?? parsed?.error;
    if (Array.isArray(message)) return message.join('. ');
    if (typeof message === 'string' && message) return message;
  } catch {
    // not JSON
  }
  return body;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = { ...(await getAuthHeaders()), ...(init?.headers ?? {}) };
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    throw new KudosApiError(res.status, extractErrorMessage(errorBody, res.statusText));
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export class KudosApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'KudosApiError';
  }
}

export interface IGetKudosFeedParams {
  /** Cache key only — never sent; the server does not scope the feed by round. */
  roundId?: string;
  limit?: number;
  cursor?: string;
}

export function getKudosFeed(params: IGetKudosFeedParams): Promise<IKudosFeedPage> {
  const qs = new URLSearchParams();
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.cursor) qs.set('cursor', params.cursor);
  const query = qs.toString();
  return request<IKudosFeedPage>(`/kudos${query ? `?${query}` : ''}`);
}

export function getCommunityPool(_roundId: string): Promise<ICommunityPool> {
  return request<ICommunityPool>(`/kudos/community-pool`);
}

/** Recipient picker options; the signed-in user is excluded server-side. */
export function getRecipients(): Promise<{ items: IUserSummary[] }> {
  return request<{ items: IUserSummary[] }>(`/kudos/recipients`);
}

/** The giver comes from the session server-side and is never sent. */
export function submitCommunityKudos(input: ICommunityKudosInput): Promise<ICommunityKudos> {
  return request<ICommunityKudos>('/kudos/community', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** Giver-only, round-must-be-open — both enforced server-side. Giver and round are immutable and never sent. */
export function updateCommunityKudos(id: string, input: ICommunityKudosInput): Promise<ICommunityKudos> {
  return request<ICommunityKudos>(`/kudos/community/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
