import { useInfiniteQuery } from '@tanstack/react-query';
import { ForumQueryKeys } from '@/services/forum/constants';
import { forumFetch } from '@/services/forum/forum.service';
import { Topic } from '@/services/forum/hooks/useForumPosts';
import { liveTopics } from '@/services/forum/liveTopics';

type QueryParams = {
  cid: string | number;
  categoryTopicSort: string;
};

async function infiniteFetcher(queryParams: QueryParams, page: number) {
  if (queryParams.cid === '0') {
    const response = await forumFetch(`/api/recent?categoryTopicSort=${queryParams.categoryTopicSort}&page=${page}`);

    if (!response?.ok) {
      return [];
    }

    return await response.json();
  }

  const response = await forumFetch(
    `/api/v3/categories/${queryParams.cid}/topics?categoryTopicSort=${queryParams.categoryTopicSort}&after=${page}`,
  );

  if (!response?.ok) {
    return [];
  }

  const data = await response.json();

  return data.response;
}

export function useInfiniteForumPosts(queryParams: QueryParams) {
  const {
    isRefetching,
    data,
    error,
    isError,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    status,
    refetch,
  } = useInfiniteQuery({
    queryKey: [ForumQueryKeys.GET_INFINITE_FORUM_POSTS, queryParams.cid, queryParams.categoryTopicSort],
    initialPageParam: queryParams.cid === '0' ? 1 : 0,
    queryFn: async ({ pageParam = queryParams.cid === '0' ? 1 : 0 }) => {
      return infiniteFetcher(queryParams, pageParam);
    },
    getNextPageParam: (data, allPages, lastPageParam) => {
      if (data.pagination) {
        return data.pagination.pageCount === data.pagination.currentPage ? undefined : data.pagination.next.page;
      }

      return data.topics.length < 20 ? undefined : data.nextStart;
    },
  });

  // Pages are counted on NodeBB's raw lists (getNextPageParam above); deleted topics only drop out of what renders.
  const items: Topic[] = liveTopics<Topic>(data?.pages?.flatMap((page) => page.topics) ?? []);

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
