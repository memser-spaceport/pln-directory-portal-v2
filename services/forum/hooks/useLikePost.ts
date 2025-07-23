import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { ForumQueryKeys } from '@/services/forum/constants';

interface MutationParams {
  pid: number;
}

async function mutation({ pid }: MutationParams) {
  const token =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im9sZWd2ZXJ6dW5vdkBnbWFpbC5jb20iLCJhdWQiOlsiY2xvcmlnMG13MDVsaW9kZ3ZlbHR2cjhwciJdLCJpYXQiOjE3NTMxODEzNzgsImV4cCI6MTc2MzU0OTM3OCwiaXNzIjoiaHR0cHM6Ly9kZXYtYXV0aC5wbG5ldHdvcmsuaW8iLCJzdWIiOiJjbWFxa2hjcGgwNTV4b2RkN3B4dmxsYWZ1IiwianRpIjoiYTZmOTE2NDAxMzJkODAwOWI0NDQ1ZDQ0NDdkMDM2ZDMifQ.bjGBEE_Odn17200-Vblp67VJcw-kTvEd_FX47ATSMBA';

  const response = await customFetch(
    `${process.env.FORUM_API_URL}/api/v3/posts/${pid}/vote`,
    {
      method: 'PUT',
      body: JSON.stringify({
        delta: 1,
      }),
      headers: {
        'Content-Type': 'application/json',
        // Authorization: `Bearer ${token}`,
      },
    },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to create post');
  }

  return await response.json();
}

export function useLikePost() {
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
