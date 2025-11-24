import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';
import { customFetch } from '@/utils/fetch-wrapper';

async function setCalendarAdded(demoDayId: string): Promise<boolean> {
  const url = `${process.env.DIRECTORY_API_URL}/v1/demo-days/${demoDayId}/engagement/calendar-added`;

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
  const params = useParams();
  const demoDayId = params.demoDayId as string;

  return useMutation({
    mutationFn: () => setCalendarAdded(demoDayId),
    onSuccess: () => {
      // Invalidate engagement query to refetch the updated data
      queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_ENGAGEMENT, demoDayId] });
    },
    onError: (error) => {
      console.error('Failed to set calendar added flag:', error);
    },
  });
}
