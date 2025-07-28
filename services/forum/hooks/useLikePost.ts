import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { ForumQueryKeys } from '@/services/forum/constants';
import { TopicResponse } from '@/services/forum/hooks/useForumPost';
import { toast } from 'react-toastify';

interface MutationParams {
  pid: number;
  tid: number;
}

async function mutation({ pid }: MutationParams) {
  const token = process.env.CUSTOM_FORUM_AUTH_TOKEN;

  const response = await customFetch(
    `${process.env.FORUM_API_URL}/api/v3/posts/${pid}/vote`,
    {
      method: 'PUT',
      body: JSON.stringify({
        delta: 1,
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
    throw new Error(res?.status.message || 'Failed to like post');
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
      // queryClient.invalidateQueries({
      //   queryKey: [ForumQueryKeys.GET_TOPIC],
      // });
    },
    onMutate: async ({ tid, pid }) => {
      await queryClient.cancelQueries({
        queryKey: [ForumQueryKeys.GET_TOPIC],
      });

      const prev = queryClient.getQueryData([ForumQueryKeys.GET_TOPIC, tid.toString()]);

      queryClient.setQueryData([ForumQueryKeys.GET_TOPIC, tid.toString()], (old: TopicResponse) => {
        if (!old) {
          return old;
        }

        return {
          ...old,
          posts: old.posts.map((post) => {
            if (post.pid === pid) {
              return {
                ...post,
                upvoted: true,
                votes: post.votes + 1,
              };
            }

            return post;
          }),
        };
      });

      return { prev };
    },
    onError: (error, { tid }, context) => {
      if (context?.prev) {
        queryClient.setQueryData([ForumQueryKeys.GET_TOPIC, tid.toString()], context.prev);
      }

      toast.error(error.message);
    },
  });
}
