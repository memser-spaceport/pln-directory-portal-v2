import { useQuery } from '@tanstack/react-query';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';
import { customFetch } from '@/utils/fetch-wrapper';

export type EngagementData = {
  calendarAdded: boolean;
};

async function fetcher(): Promise<EngagementData> {
  const url = `${process.env.DIRECTORY_API_URL}/v1/demo-days/current/engagement`;

  const response = await customFetch(
    url,
    {
      method: 'GET',
    },
    true, // withAuth
  );

  if (!response?.ok) {
    throw new Error('Failed to fetch engagement data');
  }

  const data: EngagementData = await response.json();
  return data;
}

export function useGetEngagement() {
  return useQuery({
    queryKey: [DemoDayQueryKeys.GET_ENGAGEMENT],
    queryFn: fetcher,
  });
}
