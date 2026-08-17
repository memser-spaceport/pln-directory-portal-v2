import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { ForumQueryKeys } from '@/services/forum/constants';
import { TopicResponse } from '@/services/forum/hooks/useForumPost';
import { toast } from '@/components/core/ToastContainer';
import { setStoredForumPostLike } from '@/utils/forumPostLikeStorage';

interface MutationParams {
  pid: number;
  tid: number;
  /** The viewer's CURRENT liked state — the mutation toggles to the opposite. */
  isLiked: boolean;
}

// PUT adds a vote (NodeBB write API v3), DELETE removes it — the symmetric
// toggle services/feed/feed.service.ts's toggleFeedForumPostLike already uses
// for the same endpoint. Previously this only ever PUT, so an already-liked
// post had no way to unlike.
async function mutation({ pid, isLiked }: MutationParams) {
  const token = process.env.CUSTOM_FORUM_AUTH_TOKEN;
  const nextLiked = !isLiked;

  const response = await customFetch(
    `${process.env.FORUM_API_URL}/api/v3/posts/${pid}/vote`,
    {
      method: nextLiked ? 'PUT' : 'DELETE',
      ...(nextLiked ? { body: JSON.stringify({ delta: 1 }) } : {}),
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    },
    !token,
  );

  if (!response?.ok) {
    const res = await response?.json();
    throw new Error(res?.status.message || `Failed to ${nextLiked ? 'like' : 'unlike'} post`);
  }

  return await response.json();
}

export function useLikePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mutation,
    onMutate: async ({ tid, pid, isLiked }) => {
      await queryClient.cancelQueries({
        queryKey: [ForumQueryKeys.GET_TOPIC],
      });

      const nextLiked = !isLiked;
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
                upvoted: nextLiked,
                votes: Math.max(0, post.votes + (nextLiked ? 1 : -1)),
              };
            }

            return post;
          }),
        };
      });

      return { prev, nextLiked };
    },
    onSuccess: (_data, { tid }, context) => {
      queryClient.invalidateQueries({
        queryKey: [ForumQueryKeys.GET_TOPICS],
      });
      // queryClient.invalidateQueries({
      //   queryKey: [ForumQueryKeys.GET_TOPIC],
      // });
      if (context) {
        setStoredForumPostLike(`fp_${tid}`, context.nextLiked);
      }
    },
    onError: (error, { tid }, context) => {
      if (context?.prev) {
        queryClient.setQueryData([ForumQueryKeys.GET_TOPIC, tid.toString()], context.prev);
      }

      toast.error(error.message);
    },
  });
}
