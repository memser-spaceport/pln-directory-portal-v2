import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { ForumQueryKeys } from '@/services/forum/constants';
import { toast } from 'react-toastify';
import { getCookiesFromClient } from '@/utils/third-party.helper';

interface MutationParams {
  uid?: string;
  pid: number;
  title: string;
  content: string;
}

async function mutation({ pid, title, content, uid }: MutationParams) {
  const token = process.env.CUSTOM_FORUM_AUTH_TOKEN;
  const { userInfo } = getCookiesFromClient();

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
        ...(uid && uid !== userInfo.uid ? { 'x-impersonate-member-uid': uid } : {}),
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
