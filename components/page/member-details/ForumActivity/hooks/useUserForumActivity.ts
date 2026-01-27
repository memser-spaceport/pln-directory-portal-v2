import { useQuery } from '@tanstack/react-query';

import { ForumQueryKeys } from '@/services/forum/constants';

type ActivityCount = {
  postsCount: number;
  commentsCount: number;
};

async function fetcher(memberUid: string): Promise<ActivityCount> {
  const response = await fetch(`/api/forum/users/${memberUid}/activity`, {
    credentials: 'include',
  });

  if (!response?.ok) {
    return { postsCount: 0, commentsCount: 0 };
  }

  const data = await response.json();

  return data as ActivityCount;
}

export function useUserForumActivity(memberUid: string | undefined) {
  return useQuery({
    queryKey: [ForumQueryKeys.GET_USER_FORUM_ACTIVITY, memberUid],
    queryFn: () => fetcher(memberUid!),
    enabled: !!memberUid,
  });
}
