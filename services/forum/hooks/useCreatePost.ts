import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { ForumQueryKeys } from '@/services/forum/constants';
import { getCookiesFromClient } from '@/utils/third-party.helper';

export interface CreatePostMutationParams {
  uid: string;
  cid: number;
  title: string;
  content: string;
}

async function mutation({ uid, cid, title, content }: CreatePostMutationParams) {
  const token = process.env.CUSTOM_FORUM_AUTH_TOKEN;
  const { userInfo } = getCookiesFromClient();

  const response = await customFetch(
    `${process.env.FORUM_API_URL}/api/v3/topics`,
    {
      method: 'POST',
      body: JSON.stringify({
        cid,
        title,
        content,
      }),
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(uid && uid !== userInfo.uid ? { 'x-impersonate-member-uid': uid } : {}),
      },
      credentials: 'include',
    },
    !token,
  );

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
