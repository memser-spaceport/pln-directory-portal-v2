import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ForumQueryKeys } from '@/services/forum/constants';
import { forumFetch } from '@/services/forum/forum.service';
import { useCurrentUserStore } from '@/services/auth/store';

export interface CreatePostMutationParams {
  uid: string;
  cid: number;
  title: string;
  content: string;
}

async function mutation({ uid, cid, title, content }: CreatePostMutationParams) {
  const currentUser = useCurrentUserStore.getState().currentUser;

  const response = await forumFetch('/api/v3/topics', {
    method: 'POST',
    body: JSON.stringify({
      cid,
      title,
      content,
    }),
    headers: {
      ...(uid && uid !== currentUser?.uid ? { 'x-impersonate-member-uid': uid } : {}),
    },
  });

  if (!response?.ok) {
    const res = await response?.json();
    throw new Error(res?.status.message || 'Failed to create post');
  }

  return await response.json();
}

export function useCreatePost() {
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
