import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { NotificationsQueryKeys } from '@/services/notifications/constants';

type MutationParams = {
  uid: string;
  itemType: 'POST_COMMENT';
  contextId: number;
  payload: Record<string, string>;
};

async function mutation({ uid, itemType, contextId, payload }: MutationParams) {
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/notification/settings/${uid}/item/${itemType}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        contextId: contextId.toString(),
        settings: payload,
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
