import { useMutation } from '@tanstack/react-query';
import { followTeam, unfollowTeam } from '../follow.service';
import type { ITeamFollowState } from '@/types/follow.types';

export type FollowAction = { teamUid: string; action: 'follow' | 'unfollow' };

export function useFollowTeam() {
  return useMutation({
    mutationFn: ({ teamUid, action }: FollowAction): Promise<ITeamFollowState | null> =>
      action === 'follow' ? followTeam(teamUid) : unfollowTeam(teamUid),
  });
}
