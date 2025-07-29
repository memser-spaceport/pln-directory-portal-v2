import { useQuery } from '@tanstack/react-query';
import { NotificationsQueryKeys } from '@/services/notifications/constants';
import { customFetch } from '@/utils/fetch-wrapper';

type MemberNotificationSettings = {
  memberUid: string;
  memberExternalId: string;
  type: 'POST_COMMENT';
  contextId: number | string;
  settings: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
};

async function fetcher(uid: string, itemType: string = 'POST_COMMENT', contextId: number = 0) {
  const response = await customFetch(`${process.env.DIRECTORY_API_URL}/v1/notification/settings/${uid}/item/${itemType}?contextId=${contextId}`, {}, true);

  if (!response?.ok) {
    throw new Error('Failed to fetch member notification settings');
  }

  return (await response.json()) as MemberNotificationSettings;
}

export function useGetMemberNotificationSettings(uid: string, itemType: string = 'POST_COMMENT', contextId: number = 0) {
  return useQuery({
    queryKey: [NotificationsQueryKeys.GET_MEMBER_NOTIFICATIONS_SETTINGS, uid, itemType, contextId],
    queryFn: () => fetcher(uid, itemType, contextId),
    enabled: Boolean(uid && itemType && contextId),
  });
}
