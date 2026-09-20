import { customFetch } from '@/utils/fetch-wrapper';
import type { IFollowedTeamsResponse, ITeamFollowState, ITeamFollowersResponse } from '@/types/follow.types';

export async function followTeam(teamUid: string): Promise<ITeamFollowState | null> {
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/teams/${encodeURIComponent(teamUid)}/follow`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' } },
    true,
  );
  if (!response?.ok) return null;
  return (await response.json()) as ITeamFollowState;
}

export async function unfollowTeam(teamUid: string): Promise<ITeamFollowState | null> {
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/teams/${encodeURIComponent(teamUid)}/follow`,
    { method: 'DELETE' },
    true,
  );
  if (!response?.ok) return null;
  return (await response.json()) as ITeamFollowState;
}

const FOLLOWED_TEAMS_PAGE_SIZE = 200;

/** One page of the teams the authenticated member follows. */
export async function getFollowedTeams(page: number): Promise<IFollowedTeamsResponse | null> {
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/members/me/following/teams?page=${page}&limit=${FOLLOWED_TEAMS_PAGE_SIZE}`,
    { method: 'GET' },
    true,
  );
  if (!response?.ok) return null;
  return (await response.json()) as IFollowedTeamsResponse;
}

export async function getTeamFollowers(
  teamUid: string,
  options?: { authToken?: string },
): Promise<ITeamFollowersResponse | null> {
  const response = await fetch(
    `${process.env.DIRECTORY_API_URL}/v1/teams/${encodeURIComponent(teamUid)}/followers`,
    {
      method: 'GET',
      headers: options?.authToken ? { Authorization: `Bearer ${options.authToken}` } : {},
      cache: 'no-store',
    },
  );
  if (!response.ok) return null;
  return (await response.json()) as ITeamFollowersResponse;
}
