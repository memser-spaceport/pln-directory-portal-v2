import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { ForumQueryKeys } from '@/services/forum/constants';
import { toast } from 'react-toastify';

interface MutationParams {
  pid: number;
  title: string;
  content: string;
}

async function mutation({ pid, title, content }: MutationParams) {
  const token = process.env.CUSTOM_FORUM_AUTH_TOKEN;

  const response = await customFetch(
    `${process.env.FORUM_API_URL}/api/v3/posts/${pid}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        title,
        content,
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
