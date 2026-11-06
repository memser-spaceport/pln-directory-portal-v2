import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ForumQueryKeys } from '@/services/forum/constants';
import { forumFetch } from '@/services/forum/forum.service';
import { useCurrentUserStore } from '@/services/auth/store';

export interface EditPostMutationParams {
  uid?: string | null;
  pid: number;
  title: string;
  content: string;
}

async function mutation({ pid, title, content, uid }: EditPostMutationParams) {
  const currentUser = useCurrentUserStore.getState().currentUser;

  const response = await forumFetch(`/api/v3/posts/${pid}`, {
    method: 'PUT',
    body: JSON.stringify({
      title,
      content,
    }),
    headers: {
      ...(uid && uid !== currentUser?.uid ? { 'x-impersonate-member-uid': uid } : {}),
    },
  });

  if (!response?.ok) {
    const res = await response?.json();
    throw new Error(res?.status.message || 'Failed to update post');
  }

  return await response.json();
}

export function useEditPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mutation,
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
