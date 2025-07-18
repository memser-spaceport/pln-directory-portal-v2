import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMember } from '@/services/members.service';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { MembersQueryKeys } from '@/services/members/constants';
import { customFetch } from '@/utils/fetch-wrapper';

interface MutationParams {
  uid: string;
  payload: any;
}

async function mutation({ uid, payload }: MutationParams) {
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/member/${uid}/preferences`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to update member preferences');
  }

  return response.json();
}

export function useUpdateMemberPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mutation,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [MembersQueryKeys.GET_MEMBER],
      });

      queryClient.invalidateQueries({
        queryKey: [MembersQueryKeys.GET_MEMBERS_LIST],
      });

      queryClient.invalidateQueries({
        queryKey: [MembersQueryKeys.GET_MEMBER_REPOSITORIES],
      });
    },
  });
}
