import { useQuery } from '@tanstack/react-query';
import { ForumQueryKeys } from '@/services/forum/constants';
import { customFetch } from '@/utils/fetch-wrapper';

async function fetcher() {
  // const responce = await customFetch(`${process.env.FORUM_API_URL}/api/v3/categories`, {}, true);
  //
  // if (!responce?.ok) {
  //   return [];
  // }

  // return responce.json();

  return [
    {
      cid: 0,
      name: 'All',
    },
    {
      cid: 1,
      name: 'General',
    },
    {
      cid: 2,
      name: 'Launch',
    },
    {
      cid: 3,
      name: 'Recruiting',
    },
  ];
}

export function useForumTopics() {
  return useQuery({
    queryKey: [ForumQueryKeys.GET_TOPICS],
    queryFn: fetcher,
  });
}
