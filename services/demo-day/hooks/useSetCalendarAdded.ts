import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';
import { customFetch } from '@/utils/fetch-wrapper';

async function setCalendarAdded(): Promise<boolean> {
  const url = `${process.env.DIRECTORY_API_URL}/v1/demo-days/current/engagement/calendar-added`;

  const response = await customFetch(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    },
    true, // withAuth
  );

  if (!response?.ok) {
    throw new Error('Failed to set calendar added flag');
  }

  return true;
}

export function useSetCalendarAdded() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setCalendarAdded,
    onSuccess: () => {
      // Invalidate engagement query to refetch the updated data
      queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_ENGAGEMENT] });
    },
    onError: (error) => {
      console.error('Failed to set calendar added flag:', error);
    },
  });
}
