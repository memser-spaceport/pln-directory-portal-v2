import { useQuery } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { ForumQueryKeys } from '@/services/forum/constants';

export type ForumDigestSettings = {
  forumDigestEnabled: boolean;
  forumDigestFrequency: 1 | 7;
  forumDigestLastSentAt: null;
  memberExternalId: null;
  memberUid: string;
};

async function fetcher(uid: string | undefined) {
  if (!uid) {
    return null;
  }

  const response = await customFetch(`${process.env.DIRECTORY_API_URL}/v1/notification/settings/${uid}/forum`, {}, true);

  if (!response?.ok) {
    throw new Error('Failed to fetch forum digest settings');
  }

  return (await response.json()) as ForumDigestSettings;
}

export function useGetForumDigestSettings(uid: string | undefined, initialData: ForumDigestSettings) {
  return useQuery({
    queryKey: [ForumQueryKeys.GET_FORUM_DIGEST_SETTINGS, uid],
    queryFn: () => fetcher(uid),
    enabled: Boolean(uid),
    initialData,
  });
}
