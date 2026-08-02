import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ForumQueryKeys } from '@/services/forum/constants';
import { postForumReply, type PostForumReplyParams } from '@/services/forum/forum.service';

export type PostCommentMutationParams = PostForumReplyParams;

export function usePostComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postForumReply,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [ForumQueryKeys.GET_TOPICS],
      });
      queryClient.invalidateQueries({
        queryKey: [ForumQueryKeys.GET_TOPIC],
      });
    },
  });
}
