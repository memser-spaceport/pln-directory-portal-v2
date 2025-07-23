import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { ForumQueryKeys } from '@/services/forum/constants';

interface MutationParams {
  tid: number;
  toPid: number;
  content: string;
}

async function mutation({ tid, toPid, content }: MutationParams) {
  const token =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im9sZWd2ZXJ6dW5vdkBnbWFpbC5jb20iLCJhdWQiOlsiY2xvcmlnMG13MDVsaW9kZ3ZlbHR2cjhwciJdLCJpYXQiOjE3NTMxODEzNzgsImV4cCI6MTc2MzU0OTM3OCwiaXNzIjoiaHR0cHM6Ly9kZXYtYXV0aC5wbG5ldHdvcmsuaW8iLCJzdWIiOiJjbWFxa2hjcGgwNTV4b2RkN3B4dmxsYWZ1IiwianRpIjoiYTZmOTE2NDAxMzJkODAwOWI0NDQ1ZDQ0NDdkMDM2ZDMifQ.bjGBEE_Odn17200-Vblp67VJcw-kTvEd_FX47ATSMBA';

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
        // Authorization: `Bearer ${token}`,
      },
    },
    true,
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
