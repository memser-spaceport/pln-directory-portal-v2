import { useMutation } from '@tanstack/react-query';
import { toggleTeamNewsUpvote } from '../team-news.service';

export type UpvoteToggleAction = { uid: string; isUpvoted: boolean };

export function useTeamNewsUpvoteToggle() {
  return useMutation({
    mutationFn: ({ uid, isUpvoted }: UpvoteToggleAction) => toggleTeamNewsUpvote(uid, isUpvoted),
  });
}
