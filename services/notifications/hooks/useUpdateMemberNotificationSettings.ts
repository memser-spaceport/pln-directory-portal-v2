import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { NotificationsQueryKeys } from '@/services/notifications/constants';

type MutationParams = {
  uid: string;
  forumDigestEnabled: boolean;
  forumDigestFrequency: number;
  forumReplyNotificationsEnabled: boolean;
};

async function mutation({ uid, forumDigestEnabled, forumDigestFrequency, forumReplyNotificationsEnabled }: MutationParams) {
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/notification/settings/${uid}/forum`,
    {
      method: 'PUT',
      body: JSON.stringify({
        forumDigestEnabled,
        forumDigestFrequency,
        forumReplyNotificationsEnabled,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to update member notification settings');
  }

  return await response.json();
}

export function useUpdateMemberNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mutation,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [NotificationsQueryKeys.GET_MEMBER_NOTIFICATIONS_SETTINGS],
      });
    },
  });
}
