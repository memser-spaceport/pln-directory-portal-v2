import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { ForumQueryKeys } from '@/services/forum/constants';

export interface PostCommentMutationParams {
  tid: number;
  toPid: number;
  content: string;
}

async function mutation({ tid, toPid, content }: PostCommentMutationParams) {
  const token = process.env.CUSTOM_FORUM_AUTH_TOKEN;

  const response = await customFetch(
    `${process.env.FORUM_API_URL}/api/v3/topics/${tid}`,
    {
      method: 'POST',
      body: JSON.stringify({
        content,
        toPid,
      }),
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
    !token,
  );

  if (!response?.ok) {
    const res = await response?.json();
    throw new Error(res?.status.message || 'Failed to add comment');
  }

  return await response.json();
}

export function usePostComment() {
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
