import { useMutation } from '@tanstack/react-query';
import { followTeam, unfollowTeam } from '../follow.service';
import type { ITeamFollowState } from '@/types/follow.types';

export type FollowAction = { teamUid: string; action: 'follow' | 'unfollow' };

// Intentionally a bare mutation: call sites own their optimistic/consistency
// policy (local Set overlays in TeamNews and useTeamFollowToggle; cache patching
// + invalidation in useToggleTeamFollowInList for the /teams grid). Do not add
// invalidateQueries here — it would refetch the suggestions query and drop
// NewsRail rows mid-confirm-animation.
export function useFollowTeam() {
  return useMutation({
    mutationFn: ({ teamUid, action }: FollowAction): Promise<ITeamFollowState | null> =>
      action === 'follow' ? followTeam(teamUid) : unfollowTeam(teamUid),
  });
}
