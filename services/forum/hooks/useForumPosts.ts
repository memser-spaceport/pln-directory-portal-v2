import { useQuery } from '@tanstack/react-query';
import { ForumQueryKeys } from '@/services/forum/constants';
import { customFetch } from '@/utils/fetch-wrapper';

export type Topic = {
  category: Record<string, string>;
  cid: number;
  deleted: number;
  downvotes: number;
  followed: boolean;
  followercount: number;
  icons: [];
  ignored: boolean;
  index: number;
  isOwner: boolean;
  lastposttime: number;
  lastposttimeISO: string;
  locked: number;
  mainPid: number;
  pinExpiry: number;
  pinExpiryISO: string;
  pinned: number;
  postcount: number;
  postercount: number;
  scheduled: boolean;
  slug: string;
  tags: [];
  teaser: { content: string } | null;
  teaserPid: null;
  thumbs: {
    id: number;
    name: string;
    path: string;
    url: string;
  }[];
  tid: number;
  timestamp: number;
  timestampISO: string;
  title: string;
  titleRaw: string;
  uid: number;
  unread: boolean;
  unreplied: boolean;
  upvotes: number;
  user: {
    banned: boolean;
    banned_until_readable: string;
    displayname: string;
    isLocal: boolean;
    picture: null;
    postcount: number;
    reputation: number;
    signature: null;
    status: 'online';
    uid: string;
    username: string;
    userslug: string;
    teamRole: string | null;
    teamName: string | null;
  };
  viewcount: number;
  votes: number;
};

async function fetcher(cid: number | string, categoryTopicSort: string) {
  const token = process.env.CUSTOM_FORUM_AUTH_TOKEN;

  if (cid === '0') {
    const response = await customFetch(
      `${process.env.FORUM_API_URL}/api/recent?categoryTopicSort=${categoryTopicSort}`,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      },
      !token,
    );

    if (!response?.ok) {
      return [];
    }

    const data = await response.json();

    return data.topics as Topic[];
  }

  const response = await customFetch(
    `${process.env.FORUM_API_URL}/api/v3/categories/${cid}/topics?categoryTopicSort=${categoryTopicSort}`,
    {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    },
    !token,
  );

  if (!response?.ok) {
    return [];
  }

  const data = await response.json();

  return data.response.topics as Topic[];
}

export function useForumPosts(cid = 1, categoryTopicSort = 'recently_replied') {
  return useQuery({
    queryKey: [ForumQueryKeys.GET_TOPICS, cid, categoryTopicSort],
    queryFn: () => fetcher(cid, categoryTopicSort),
  });
}
