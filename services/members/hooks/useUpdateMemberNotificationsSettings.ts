import { useMutation } from '@tanstack/react-query';
import { MemberNotificationSettings } from '@/services/members/types';
import { customFetch } from '@/utils/fetch-wrapper';
import { omit } from 'lodash';

type MutationParams = Partial<MemberNotificationSettings>;

async function mutation(params: MutationParams) {
  if (!params.memberUid) {
    return null;
  }

  const url = `${process.env.DIRECTORY_API_URL}/v1/notification/settings/${params.memberUid}`;

  const response = await customFetch(
    url,
    {
      method: 'PATCH',
      body: {
        ...omit(params, 'memberUid'),
      },
    },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to fetch notifications settings');
  }

  return response as unknown as MemberNotificationSettings;
}

export function useUpdateMemberNotificationsSettings() {
  return useMutation({
    mutationFn: mutation,
  });
}
