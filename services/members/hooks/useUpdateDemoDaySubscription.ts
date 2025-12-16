import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { MembersQueryKeys } from '@/services/members/constants';

interface MutationParams {
  uid: string;
  demoDaySubscriptionEnabled: boolean;
}

async function mutation({ uid, demoDaySubscriptionEnabled }: MutationParams) {
  const url = `${process.env.DIRECTORY_API_URL}/v1/notification/settings/${uid}/demo-day-subscription`;

  const response = await customFetch(
    url,
    {
      method: 'PUT',
      body: JSON.stringify({ demoDaySubscriptionEnabled }),
      headers: {
        'Content-Type': 'application/json',
      },
    },
    true,
  );

  if (!response?.ok) {
    const res = await response?.json();
    throw new Error(res?.status?.message || 'Failed to update demo day subscription settings');
  }

  return await response.json();
}

export function useUpdateDemoDaySubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mutation,
    onMutate: async ({ uid, demoDaySubscriptionEnabled }: MutationParams) => {
      await queryClient.cancelQueries({
        queryKey: [MembersQueryKeys.GET_DEMO_DAY_SUBSCRIPTION, uid],
      });

      const prev = queryClient.getQueryData([MembersQueryKeys.GET_DEMO_DAY_SUBSCRIPTION, uid]);

      queryClient.setQueryData([MembersQueryKeys.GET_DEMO_DAY_SUBSCRIPTION, uid], {
        demoDaySubscriptionEnabled,
      });

      return { prev };
    },
    onError: (error, { uid }, context) => {
      if (context?.prev) {
        queryClient.setQueryData([MembersQueryKeys.GET_DEMO_DAY_SUBSCRIPTION, uid], context.prev);
      }
    },
    onSuccess: (data, { uid }) => {
      queryClient.invalidateQueries({
        queryKey: [MembersQueryKeys.GET_DEMO_DAY_SUBSCRIPTION, uid],
      });
    },
  });
}

