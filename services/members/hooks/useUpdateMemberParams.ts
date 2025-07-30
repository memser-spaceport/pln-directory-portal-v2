import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MembersQueryKeys } from '@/services/members/constants';
import { customFetch } from '@/utils/fetch-wrapper';

interface MutationParams {
  uid: string;
  payload: any;
}

async function mutation({ uid, payload }: MutationParams) {
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/members/${uid}`,
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
    const res = await response?.json();
    throw new Error(res?.status.message || 'Failed to update members params');
  }

  return await response.json();
}

export function useUpdateMemberParams() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mutation,
    onMutate: async ({ uid, payload }: MutationParams) => {
      await queryClient.cancelQueries({
        queryKey: [MembersQueryKeys.GET_MEMBER, uid],
      });

      const prev = queryClient.getQueryData([MembersQueryKeys.GET_MEMBER, uid]);

      queryClient.setQueryData([MembersQueryKeys.GET_MEMBER, uid], (old) => {
        if (!old) {
          return old;
        }

        return {
          ...old,
          ...payload,
        };
      });

      return { prev };
    },
    onError: (error, { uid }, context) => {
      if (context?.prev) {
        queryClient.setQueryData([MembersQueryKeys.GET_MEMBER, uid], context.prev);
      }
    },
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
