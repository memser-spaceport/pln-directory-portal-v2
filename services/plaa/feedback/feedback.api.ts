import { getCookiesFromClient } from '@/utils/third-party.helper';
import {
  CreateFeedbackInput,
  FeedbackApiError,
  FeedbackComment,
  FeedbackCommentListResponse,
  FeedbackItem,
  FeedbackListParams,
  FeedbackListResponse,
  FeedbackMe,
  FeedbackStatus,
  FeedbackType,
  RoadmapResponse,
  VoteResponse,
} from './feedback.types';

const BASE = '/api/plaa/feedback';

function authHeader(): string {
  const { authToken } = getCookiesFromClient();
  if (!authToken) throw new FeedbackApiError('Not signed in', 401);
  return `Bearer ${authToken}`;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { Authorization: authHeader(), ...(init.headers ?? {}) },
  });

  if (!res.ok) {
    // Keep the status: the UI shows a different message for 429 than for 409.
    throw new FeedbackApiError(await readError(res), res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string; message?: string };
    return body.error ?? body.message ?? `Request failed: ${res.status}`;
  } catch {
    return `Request failed: ${res.status}`;
  }
}

function listQuery(params: FeedbackListParams): string {
  const search = new URLSearchParams();
  if (params.type) search.set('type', params.type);
  if (params.status) search.set('status', params.status);
  if (params.sort) search.set('sort', params.sort);
  if (params.mine) search.set('mine', 'true');
  if (params.cursor) search.set('cursor', params.cursor);
  if (params.limit) search.set('limit', String(params.limit));
  const query = search.toString();
  return query ? `?${query}` : '';
}

export const feedbackApi = {
  me: () => request<FeedbackMe>('/me'),

  list: (params: FeedbackListParams) => request<FeedbackListResponse>(`/items${listQuery(params)}`),

  item: (id: string) => request<FeedbackItem>(`/items/${id}`),

  roadmap: (perColumn = 20) => request<RoadmapResponse>(`/roadmap?per_column=${perColumn}`),

  triage: (cursor?: string) =>
    request<FeedbackListResponse>(`/triage${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`),

  /**
   * multipart/form-data, matching §5. The payload travels as one JSON part so
   * the upstream validates exactly one object, not a dozen loose fields.
   */
  create: ({ screenshots = [], ...payload }: CreateFeedbackInput) => {
    const form = new FormData();
    form.append('payload', JSON.stringify(payload));
    screenshots.forEach((file) => form.append('screenshots', file, file.name));
    // No Content-Type here on purpose: the browser must set the multipart
    // boundary itself.
    return request<FeedbackItem>('/items', { method: 'POST', body: form });
  },

  addVote: (id: string) => request<VoteResponse>(`/items/${id}/vote`, { method: 'PUT' }),

  removeVote: (id: string) => request<VoteResponse>(`/items/${id}/vote`, { method: 'DELETE' }),

  comments: (id: string, cursor?: string) =>
    request<FeedbackCommentListResponse>(
      `/items/${id}/comments${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`,
    ),

  addComment: (id: string, body: string) =>
    request<FeedbackComment>(`/items/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    }),

  deleteComment: (commentId: string) => request<void>(`/comments/${commentId}`, { method: 'DELETE' }),

  hideComment: (commentId: string, hidden: boolean) =>
    request<void>(`/comments/${commentId}/hide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hidden }),
    }),

  changeStatus: (id: string, toStatus: FeedbackStatus, note?: string, duplicateOfId?: string) =>
    request<FeedbackItem>(`/items/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to_status: toStatus, note, duplicate_of_id: duplicateOfId }),
    }),

  adminUpdate: (id: string, body: { type?: FeedbackType; title?: string; is_public?: boolean; removed?: boolean }) =>
    request<FeedbackItem>(`/items/${id}/admin`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  retryLinear: (id: string) => request<FeedbackItem>(`/items/${id}/linear-retry`, { method: 'POST' }),
};
