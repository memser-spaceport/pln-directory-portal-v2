import { customFetch } from '@/utils/fetch-wrapper';
import type { ITeamNewsByTeamResponse, ITeamNewsGroupedResponse } from '@/types/team-news.types';
import { getHeader } from '@/utils/common.utils';
import { TEAM_NEWS_DEFAULT_WINDOW_DAYS } from './constants';
import { MOCK_TEAM_NEWS_GROUPED_RESPONSE } from './team-news.mock-data';

interface FetchGroupedOptions {
  windowDays?: number;
}

export interface FetchTeamNewsByTeamOptions {
  page?: number;
  limit?: number;
  q?: string;
}

export function buildTeamNewsByTeamUrl(teamUid: string, options: FetchTeamNewsByTeamOptions = {}): string {
  const params = new URLSearchParams();
  if (options.page !== undefined) params.set('page', String(options.page));
  if (options.limit !== undefined) params.set('limit', String(options.limit));
  if (options.q?.trim()) params.set('q', options.q.trim());
  const qs = params.toString();
  return `${process.env.DIRECTORY_API_URL}/v1/teams/${encodeURIComponent(teamUid)}/team-news${qs ? `?${qs}` : ''}`;
}

export async function fetchTeamNewsByTeam(
  teamUid: string,
  options: FetchTeamNewsByTeamOptions = {},
): Promise<ITeamNewsByTeamResponse | null> {
  const url = buildTeamNewsByTeamUrl(teamUid, options);

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as ITeamNewsByTeamResponse;
  } catch {
    return null;
  }
}

export async function getTeamNewsGroupedByFocusArea(
  options: FetchGroupedOptions = {},
  authToken?: string,
): Promise<ITeamNewsGroupedResponse | null> {
  if (process.env.MOCK_TEAM_NEWS === 'true') {
    return MOCK_TEAM_NEWS_GROUPED_RESPONSE;
  }

  const windowDays = options.windowDays ?? TEAM_NEWS_DEFAULT_WINDOW_DAYS;
  const url = `${process.env.DIRECTORY_API_URL}/v1/team-news/grouped-by-focus-area?windowDays=${windowDays}`;

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: getHeader(authToken),
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as ITeamNewsGroupedResponse;
  } catch {
    return null;
  }
}

// Called from a client-side mutation (useTeamNewsUpvoteToggle), so the mock gate must be
// NEXT_PUBLIC_ — unlike MOCK_TEAM_NEWS above, which only ever runs in a Server Component and
// can stay server-only.
export async function toggleTeamNewsUpvote(uid: string, isUpvoted: boolean): Promise<{ ok: true } | null> {
  if (process.env.NEXT_PUBLIC_MOCK_TEAM_NEWS_V1 === 'true') {
    return { ok: true };
  }

  // Real endpoint TBD by LAB-2094 (mirrors follow.service.ts's followTeam/unfollowTeam pairing).
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/team-news/${encodeURIComponent(uid)}/upvote`,
    { method: isUpvoted ? 'POST' : 'DELETE', headers: { 'Content-Type': 'application/json' } },
    true,
  );
  if (!response?.ok) return null;
  return { ok: true };
}
