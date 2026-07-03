import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FollowQueryKeys } from '@/services/follow/constants';

export const FOLLOWING_TEAMS_COUNT_KEY = [FollowQueryKeys.FOLLOWED_TEAMS, 'count'];

/**
 * Tracks how many teams the current user follows, independent of which /teams tab is active.
 * `serverValue` is the `followingTotal` from whichever tab's teams-search response is currently
 * active — every response carries it, not just followingOnly=true ones, so this resyncs to it on
 * every fetch (initial load, tab switch, or the invalidation-triggered background refetch after a
 * follow/unfollow). Between fetches, follow/unfollow mutations bump this cache directly via
 * `setQueryData` for instant feedback; the next resync corrects any drift against server truth.
 */
export function useFollowingTeamsCount(serverValue?: number) {
  const queryClient = useQueryClient();

  const { data } = useQuery<number>({
    queryKey: FOLLOWING_TEAMS_COUNT_KEY,
    queryFn: () => queryClient.getQueryData<number>(FOLLOWING_TEAMS_COUNT_KEY) ?? 0,
    enabled: false,
    staleTime: Infinity,
    initialData: 0,
  });

  useEffect(() => {
    if (serverValue === undefined) return;
    queryClient.setQueryData<number>(FOLLOWING_TEAMS_COUNT_KEY, serverValue);
  }, [serverValue, queryClient]);

  return data ?? 0;
}
