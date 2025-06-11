import { MembersQueryKeys } from '@/services/members/constants';
import { customFetch } from '@/utils/fetch-wrapper';
import { useQuery } from '@tanstack/react-query';
import { MemberNotificationSettings } from '@/services/members/types';

async function fetcher(uid: string | undefined) {
  if (!uid) {
    return null;
  }

  const url = `${process.env.DIRECTORY_API_URL}/v1/notification/settings/${uid}`;

  const response = await customFetch(
    url,
    {
      method: 'GET',
    },
    false,
  );

  if (!response?.ok) {
    throw new Error('Failed to fetch notifications settings');
  }

  const data: MemberNotificationSettings = await response.json();

  return data;
}

export function useMemberNotificationsSettings(uid: string | undefined) {
  return useQuery({
    queryKey: [MembersQueryKeys.GET_NOTIFICATIONS_SETTINGS, uid],
    queryFn: () => fetcher(uid),
    enabled: !!uid,
  });
}
