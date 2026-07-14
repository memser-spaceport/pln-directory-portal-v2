import { useQuery } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { ForumQueryKeys } from '@/services/forum/constants';
import { useForumAccess } from '@/services/access-control/hooks/useForumAccess';

export type ForumDigestSettings = {
  forumDigestEnabled: boolean;
  forumDigestFrequency: 1 | 7;
  forumDigestForumEnabled: boolean;
  forumDigestNewsEnabled: boolean;
  forumDigestLastSentAt: null;
  memberExternalId: null;
  memberUid: string;
};

async function fetcher(uid: string | undefined) {
  if (!uid) {
    return null;
  }

  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/notification/settings/${uid}/forum`,
    {},
    true,
  );

  if (!response?.ok) {
    // Non-critical background data: a 403/5xx here must not surface an error
    // (the query is seeded with initialData, so throwing would trip the global
    // query error handler on every failure, including the first fetch).
    console.error(`Failed to fetch forum digest settings (status ${response?.status ?? 'unknown'})`);
    return null;
  }

  return (await response.json()) as ForumDigestSettings;
}

export function useGetForumDigestSettings(uid: string | undefined, initialData: ForumDigestSettings) {
  const { hasAccess, isLoading: isAccessLoading } = useForumAccess();

  return useQuery({
    queryKey: [ForumQueryKeys.GET_FORUM_DIGEST_SETTINGS, uid],
    queryFn: () => fetcher(uid),
    // Users without forum.read get a guaranteed 403 from this endpoint — don't ask.
    enabled: Boolean(uid) && !isAccessLoading && hasAccess,
    initialData,
  });
}
