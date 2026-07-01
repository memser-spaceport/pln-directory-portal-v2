import { customFetch } from '@/utils/fetch-wrapper';
import type { ITeamFollowState, ITeamFollowersResponse } from '@/types/follow.types';

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

export async function getTeamFollowState(
  teamUid: string,
  options?: { authToken?: string },
): Promise<ITeamFollowState | null> {
  const response = await fetch(
    `${process.env.DIRECTORY_API_URL}/v1/teams/${encodeURIComponent(teamUid)}/follow`,
    {
      method: 'GET',
      headers: options?.authToken ? { Authorization: `Bearer ${options.authToken}` } : {},
      cache: 'no-store',
    },
  );
  if (!response.ok) return null;
  return (await response.json()) as ITeamFollowState;
}

export async function getTeamFollowers(
  teamUid: string,
  options?: { authToken?: string },
): Promise<ITeamFollowersResponse | null> {
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/teams/${encodeURIComponent(teamUid)}/followers`,
    { method: 'GET', headers: options?.authToken ? { Authorization: `Bearer ${options.authToken}` } : {} },
    true,
  );
  if (!response?.ok) return null;
  return (await response.json()) as ITeamFollowersResponse;
}
