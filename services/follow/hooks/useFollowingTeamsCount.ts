import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FollowQueryKeys } from '@/services/follow/constants';

export const FOLLOWING_TEAMS_COUNT_KEY = [FollowQueryKeys.FOLLOWED_TEAMS, 'count'];

/**
 * Tracks how many teams the current user follows, independent of which /teams tab is active.
 * Seeded once from whatever teams-search response first carries a `followingTotal`, then only
 * ever updated by explicit `setQueryData` calls from follow/unfollow mutations — never refetched.
 */
export function useFollowingTeamsCount(seed?: number) {
  const queryClient = useQueryClient();

  const { data } = useQuery<number>({
    queryKey: FOLLOWING_TEAMS_COUNT_KEY,
    queryFn: () => queryClient.getQueryData<number>(FOLLOWING_TEAMS_COUNT_KEY) ?? 0,
    enabled: false,
    staleTime: Infinity,
    initialData: 0,
  });

  useEffect(() => {
    if (seed === undefined) return;
    const existing = queryClient.getQueryData<number>(FOLLOWING_TEAMS_COUNT_KEY);
    if (existing === undefined) {
      queryClient.setQueryData<number>(FOLLOWING_TEAMS_COUNT_KEY, seed);
    }
  }, [seed, queryClient]);

  return data ?? 0;
}
