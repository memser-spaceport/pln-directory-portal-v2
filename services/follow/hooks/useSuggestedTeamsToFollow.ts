import { useQuery } from '@tanstack/react-query';
import type { ITeamNewsItem } from '@/types/team-news.types';
import { getSuggestedTeamsToFollow } from '../suggested-teams.service';
import { FollowQueryKeys } from '../constants';

interface UseSuggestedTeamsToFollowOptions {
  memberTeamUid: string | null;
  followedTeamUids: Set<string>;
  recentNewsItems: ITeamNewsItem[];
  /** `${YYYY-MM-DD}:${memberUid}` — stable within a day, varies by member. */
  seed: string;
  enabled?: boolean;
}

// followedTeamUids is deliberately NOT part of the query key — it's applied as a
// client-side filter on the result below, so following a suggested team removes it
// from the rendered list immediately via React re-render, with no refetch (which
// would also disturb the day-stable seeded order).
export function useSuggestedTeamsToFollow({
  memberTeamUid,
  followedTeamUids,
  recentNewsItems,
  seed,
  enabled = true,
}: UseSuggestedTeamsToFollowOptions) {
  const { data, isLoading } = useQuery({
    queryKey: [FollowQueryKeys.SUGGESTED_TEAMS, memberTeamUid, seed],
    queryFn: () => getSuggestedTeamsToFollow(memberTeamUid, Array.from(followedTeamUids), recentNewsItems, seed),
    enabled,
  });

  const suggestions = (data ?? []).filter((team) => !followedTeamUids.has(team.uid));

  return { suggestions, isLoading };
}
