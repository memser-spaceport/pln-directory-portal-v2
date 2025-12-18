import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { toast } from '@/components/core/ToastContainer';
import { MembersQueryKeys } from '@/services/members/constants';

export interface SubscribeToDemoDayPayload {
  email: string;
}

async function mutation(payload: SubscribeToDemoDayPayload) {
  const url = `${process.env.DIRECTORY_API_URL}/v1/demo-day-subscriptions/subscribe`;

  const response = await customFetch(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    false, // No auth required
  );

  if (!response?.ok) {
    let errorMessage = 'Failed to subscribe. Please try again.';

    try {
      const res = await response?.json();
      errorMessage = res?.message || errorMessage;
    } catch (e) {
      // If JSON parsing fails, use default error message
    }

    throw new Error(errorMessage);
  }

  return await response.json();
}

export function useSubscribeToDemoDay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubscribeToDemoDayPayload) => mutation(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [MembersQueryKeys.GET_DEMO_DAY_SUBSCRIPTION],
      });
      toast.success("Success! You're now in the loop for demo day updates.");
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to subscribe. Please try again.');
    },
  });
}
