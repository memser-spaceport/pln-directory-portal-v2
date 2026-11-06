'use client';

import { useQuery } from '@tanstack/react-query';

import { getFollowedTeams } from '../follow.service';
import { FollowQueryKeys } from '../constants';
import type { IFollowedTeam } from '@/types/follow.types';

/**
 * Every team the member follows, newest follow first (News preferences,
 * LAB-2941). Walks the pages like `useFollowedTeamUids`; a failed page ends the
 * walk with what is known. Member-scoped key: the module-scope QueryClient
 * survives auth changes.
 */
export async function fetchAllFollowedTeams(): Promise<IFollowedTeam[]> {
  const teams: IFollowedTeam[] = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages) {
    const result = await getFollowedTeams(page);
    if (!result) break;
    teams.push(...result.items);
    totalPages = Math.ceil(result.total / result.limit) || 1;
    page += 1;
  }
  return teams;
}

export function useFollowedTeams(memberUid: string | undefined) {
  return useQuery({
    queryKey: [FollowQueryKeys.FOLLOWED_TEAMS, 'list', memberUid],
    queryFn: fetchAllFollowedTeams,
    enabled: Boolean(memberUid),
  });
}
