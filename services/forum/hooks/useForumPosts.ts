import { useQuery } from '@tanstack/react-query';
import { ForumQueryKeys } from '@/services/forum/constants';
import { customFetch } from '@/utils/fetch-wrapper';

type Topic = {
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

async function fetcher(cid: string) {
  const token =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im9sZWd2ZXJ6dW5vdkBnbWFpbC5jb20iLCJhdWQiOlsiY2xvcmlnMG13MDVsaW9kZ3ZlbHR2cjhwciJdLCJpYXQiOjE3NTMxODEzNzgsImV4cCI6MTc2MzU0OTM3OCwiaXNzIjoiaHR0cHM6Ly9kZXYtYXV0aC5wbG5ldHdvcmsuaW8iLCJzdWIiOiJjbWFxa2hjcGgwNTV4b2RkN3B4dmxsYWZ1IiwianRpIjoiYTZmOTE2NDAxMzJkODAwOWI0NDQ1ZDQ0NDdkMDM2ZDMifQ.bjGBEE_Odn17200-Vblp67VJcw-kTvEd_FX47ATSMBA';

  const response = await customFetch(
    `${process.env.FORUM_API_URL}/api/v3/categories/${cid}/topics`,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
    false,
  );

  if (!response?.ok) {
    return [];
  }

  const data = await response.json();

  return data.response.topics as Topic[];
}

export function useForumPosts(cid: string) {
  return useQuery({
    queryKey: [ForumQueryKeys.GET_TOPICS, cid],
    queryFn: () => fetcher(cid),
  });
}
