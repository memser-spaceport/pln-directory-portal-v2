import { useMutation } from '@tanstack/react-query';
import { followTeam, unfollowTeam } from '../follow.service';

type FollowAction = { teamUid: string; action: 'follow' | 'unfollow' };

export function useFollowTeam() {
  return useMutation({
    mutationFn: ({ teamUid, action }: FollowAction) =>
      action === 'follow' ? followTeam(teamUid) : unfollowTeam(teamUid),
  });
}
