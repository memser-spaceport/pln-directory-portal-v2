import { useQuery } from '@tanstack/react-query';
import { getSuggestedTeamsToFollow } from '../suggested-teams.service';
import { FollowQueryKeys } from '../constants';

interface UseSuggestedTeamsToFollowOptions {
  /** Current member uid — keys the cache per user and gates the auth-required fetch. */
  currentUserUid: string | null;
  followedTeamUids: Set<string>;
  enabled?: boolean;
}

// followedTeamUids is deliberately NOT part of the query key — it's applied as a
// client-side filter on the result below, so following a suggested team removes it
// from the rendered list immediately via React re-render, with no refetch (which
// would also disturb the backend's day-stable suggestion order).
export function useSuggestedTeamsToFollow({
  currentUserUid,
  followedTeamUids,
  enabled = true,
}: UseSuggestedTeamsToFollowOptions) {
  const { data, isLoading } = useQuery({
    queryKey: [FollowQueryKeys.SUGGESTED_TEAMS, currentUserUid],
    queryFn: getSuggestedTeamsToFollow,
    enabled: enabled && Boolean(currentUserUid),
  });

  const suggestions = (data ?? []).filter((team) => !followedTeamUids.has(team.uid));

  return { suggestions, isLoading };
}
