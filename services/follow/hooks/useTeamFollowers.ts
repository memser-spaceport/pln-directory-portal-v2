import { useQuery } from '@tanstack/react-query';
import { getTeamFollowers } from '../follow.service';
import type { ITeamFollower } from '@/types/follow.types';
import { FollowQueryKeys } from '../constants';

export function useTeamFollowers(teamUid: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [FollowQueryKeys.FOLLOWED_TEAMS, 'followers', teamUid],
    queryFn: async () => {
      const result = await getTeamFollowers(teamUid);
      if (!result) return { items: [] as ITeamFollower[], total: 0 };
      return result;
    },
    enabled: options?.enabled ?? false,
    staleTime: 30_000,
  });
}
