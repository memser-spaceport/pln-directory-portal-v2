import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MemberNotificationSettings } from '@/services/members/types';
import { customFetch } from '@/utils/fetch-wrapper';
import { omit } from 'lodash';
import { MembersQueryKeys } from '@/services/members/constants';
import { EventsQueryKeys } from '@/services/events/constants';

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
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(omit(params, 'memberUid')),
    },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to fetch notifications settings');
  }

  return true; // response as unknown as MemberNotificationSettings;
}

export function useUpdateMemberNotificationsSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mutation,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [MembersQueryKeys.GET_MEMBER],
      });
    },
  });
}
