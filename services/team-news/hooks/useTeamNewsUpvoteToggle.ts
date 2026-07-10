import { useMutation } from '@tanstack/react-query';
import type { ITeamNewsUpvoteStatus } from '@/types/team-news.types';
import { toggleTeamNewsUpvote } from '../team-news.service';

// `isUpvoted` here is the desired next state — true POSTs an upvote, false DELETEs it.
export type UpvoteToggleAction = { uid: string; isUpvoted: boolean };

export function useTeamNewsUpvoteToggle() {
  return useMutation<ITeamNewsUpvoteStatus, Error, UpvoteToggleAction>({
    mutationFn: ({ uid, isUpvoted }) => toggleTeamNewsUpvote(uid, isUpvoted),
  });
}
