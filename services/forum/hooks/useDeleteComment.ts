import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ForumQueryKeys } from '@/services/forum/constants';
import { forumFetch } from '@/services/forum/forum.service';
import { feedQueryKeys } from '@/services/feed/constants';

export interface DeleteCommentParams {
  tid: number;
  pid: number;
}

/**
 * Soft-deletes one of the member's own forum comments, as NodeBB's delete does: the comment is hidden
 * (`topicReplies` leaves it out) and forum moderators can restore it. NodeBB refuses a post the member may not
 * delete. Never sends the impersonation header, so a directory admin deletes only their own comments here.
 */
export async function deleteForumComment({ pid }: DeleteCommentParams) {
  const response = await forumFetch(`/api/v3/posts/${pid}/state`, { method: 'DELETE' });

  if (!response?.ok) {
    const body = await response?.json().catch(() => null);
    throw new Error(body?.status?.message || 'Failed to delete the comment');
  }
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteForumComment,
    onSuccess: (_data, { tid }) => {
      queryClient.invalidateQueries({ queryKey: [ForumQueryKeys.GET_TOPICS] });
      queryClient.invalidateQueries({ queryKey: [ForumQueryKeys.GET_TOPIC] });
      // The home feed reads the same thread for a forum post's comments
      queryClient.invalidateQueries({ queryKey: feedQueryKeys.comments(`fp_${tid}`) });
    },
  });
}
