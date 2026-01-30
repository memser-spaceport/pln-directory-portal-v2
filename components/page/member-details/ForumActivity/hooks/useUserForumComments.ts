import { useInfiniteQuery } from '@tanstack/react-query';

import { ForumQueryKeys } from '@/services/forum/constants';

export type ForumComment = {
  pid: number;
  tid: number;
  toPid: number;
  content: string;
  sourceContent: string | null;
  uid: number;
  timestamp: number;
  deleted: boolean;
  upvotes: number;
  downvotes: number;
  replies: number;
  votes: number;
  timestampISO: string;
  user: {
    uid: number;
    username: string;
    userslug: string;
    picture: string;
    status: string;
    displayname: string;
    'icon:bgColor': string;
    'icon:text': string;
    isLocal: boolean;
  };
  topic: {
    uid: number;
    tid: number;
    title: string;
    cid: number;
    tags: string[];
    slug: string;
    deleted: number;
    scheduled: boolean;
    postcount: number;
    mainPid: number;
    teaserPid: string;
    timestamp: number;
    titleRaw: string;
    timestampISO: string;
  };
  category: {
    cid: number;
    name: string;
    icon: string;
    slug: string;
    parentCid: number;
    bgColor: string;
    color: string;
    backgroundImage: string;
    imageClass: string;
  };
  isMainPost: boolean;
  slug: string;
};

async function fetcher(memberUid: string, after: number) {
  const response = await fetch(`/api/forum/users/${memberUid}/comments?after=${after}`, {
    credentials: 'include',
  });

  if (!response?.ok) {
    return { comments: [], nextStart: null };
  }

  const data = await response.json();

  return data;
}

export function useUserForumComments(memberUid: string | undefined) {
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
    queryKey: [ForumQueryKeys.GET_USER_FORUM_COMMENTS, memberUid],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      return fetcher(memberUid!, pageParam);
    },
    getNextPageParam: (lastPage) => {
      return lastPage.nextStart ?? undefined;
    },
    enabled: !!memberUid,
  });

  const items: ForumComment[] = data?.pages?.flatMap((page) => page.comments) ?? [];

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
