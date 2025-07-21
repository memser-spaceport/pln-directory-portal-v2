import { useQuery } from '@tanstack/react-query';
import { ForumQueryKeys } from '@/services/forum/constants';
import { customFetch } from '@/utils/fetch-wrapper';

async function fetcher(topic: string) {
  const responce = await customFetch(`${process.env.FORUM_API_URL}/api/v3/categories`, {}, true);
}

export function useForumPosts(topic: string) {
  return useQuery({
    queryKey: [ForumQueryKeys.GET_POSTS, topic],
    queryFn: () => fetcher(topic),
  });
}
