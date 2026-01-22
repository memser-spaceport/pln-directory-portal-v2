import { useInfiniteQuery } from '@tanstack/react-query';

import { ForumQueryKeys } from '@/services/forum/constants';
import { Topic } from '@/services/forum/hooks/useForumPosts';

async function fetcher(memberUid: string, after: number) {
  const response = await fetch(`/api/forum/users/${memberUid}/posts?after=${after}`, {
    credentials: 'include',
  });

  if (!response?.ok) {
    return { posts: [], nextStart: null };
  }

  const data = await response.json();

  return data;
}

export function useUserForumPosts(memberUid: string | undefined) {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    status,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: [ForumQueryKeys.GET_USER_FORUM_POSTS, memberUid],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      return fetcher(memberUid!, pageParam);
    },
    getNextPageParam: (lastPage) => {
      return lastPage.nextStart ?? undefined;
    },
    enabled: !!memberUid,
  });

  const items: Topic[] = data?.pages?.flatMap((page) => page.posts) ?? [];

  return {
    data: items,
    error,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    status,
    refetch,
    isRefetching,
  };
}
