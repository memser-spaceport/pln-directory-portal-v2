import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { MembersQueryKeys } from '@/services/members/constants';

async function mutation({ uid, payload }: { uid: string; payload: any }) {
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/notification/settings/${uid}/investor`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    },
    true,
  );

  if (!response?.ok) {
    const res = await response?.json();
    throw new Error(res?.status.message || 'Failed to update investor settings');
  }

  return await response.json();
}

export function useUpdateInvestorSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mutation,
    onMutate: async ({ uid, payload }) => {
      await queryClient.cancelQueries({
        queryKey: [MembersQueryKeys.GET_INVESTOR_SETTINGS],
      });

      const prev = queryClient.getQueryData([MembersQueryKeys.GET_INVESTOR_SETTINGS, uid]);

      queryClient.setQueryData([MembersQueryKeys.GET_INVESTOR_SETTINGS, uid], (old: any) => {
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
        queryClient.setQueryData([MembersQueryKeys.GET_INVESTOR_SETTINGS, uid], context.prev);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [MembersQueryKeys.GET_INVESTOR_SETTINGS],
      });
    },
  });
}
