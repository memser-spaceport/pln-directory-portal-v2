import type { ITeamNewsByTeamResponse, ITeamNewsGroupedResponse } from '@/types/team-news.types';
import { getHeader } from '@/utils/common.utils';
import { TEAM_NEWS_DEFAULT_WINDOW_DAYS } from './constants';

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
