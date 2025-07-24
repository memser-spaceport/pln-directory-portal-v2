import { useQuery } from '@tanstack/react-query';
import { NotificationsQueryKeys } from '@/services/notifications/constants';
import { customFetch } from '@/utils/fetch-wrapper';

type MemberNotificationSettings = {
  forumDigestEnabled: boolean;
  forumDigestFrequency: number;
  forumDigestLastSentAt: null;
  forumReplyNotificationsEnabled: boolean;
  memberUid: string;
};

async function fetcher(uid: string) {
  const response = await customFetch(`${process.env.DIRECTORY_API_URL}/v1/notification/settings/${uid}/forum`, {}, true);

  if (!response?.ok) {
    throw new Error('Failed to fetch member notification settings');
  }

  return (await response.json()) as MemberNotificationSettings;
}

export function useGetMemberNotificationSettings(uid: string) {
  return useQuery({
    queryKey: [NotificationsQueryKeys.GET_MEMBER_NOTIFICATIONS_SETTINGS, uid],
    queryFn: () => fetcher(uid),
  });
}
