import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMember } from '@/services/members.service';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { MembersQueryKeys } from '@/services/members/constants';

interface MutationParams {
  uid: string;
  payload: any;
}

async function mutation({ uid, payload }: MutationParams) {
  const { authToken } = getCookiesFromClient();

  if (!authToken) {
    throw new Error('Cannot get auth token');
  }

  return await updateMember(uid, payload, authToken);
}

export function useUpdateMember() {
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
    },
  });
}
