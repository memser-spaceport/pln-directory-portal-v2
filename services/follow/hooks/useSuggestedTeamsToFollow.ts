import { useQuery } from '@tanstack/react-query';
import { getSuggestedTeamsToFollow } from '../suggested-teams.service';
import { FollowQueryKeys } from '../constants';

interface UseSuggestedTeamsToFollowOptions {
  /** Current member uid — keys the cache per user and gates the auth-required fetch. */
  currentUserUid: string | null;
  enabled?: boolean;
  /** How many suggestions to ask for; the backend caps it at 10. */
  limit?: number;
}

// Suggestions are returned unfiltered. The Teams-to-follow card applies a
// delayed client-side hide after follow (Following checkmark for 2s) so we
// must not drop teams from this list the instant followedTeamUids updates —
// that would unmount the row before the confirm state can show. Filtering
// here would also force a refetch to restore day-stable order.
export function useSuggestedTeamsToFollow({
  currentUserUid,
  enabled = true,
  limit = 3,
}: UseSuggestedTeamsToFollowOptions) {
  const { data, isLoading } = useQuery({
    queryKey: [FollowQueryKeys.SUGGESTED_TEAMS, currentUserUid, limit],
    queryFn: () => getSuggestedTeamsToFollow(limit),
    enabled: enabled && Boolean(currentUserUid),
  });

  return { suggestions: data ?? [], isLoading };
}
