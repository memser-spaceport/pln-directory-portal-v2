import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { ForumQueryKeys } from '@/services/forum/constants';

interface MutationParams {
  tid: number;
  toPid: number;
  content: string;
}

async function mutation({ tid, toPid, content }: MutationParams) {
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
    throw new Error('Failed to post comment');
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
