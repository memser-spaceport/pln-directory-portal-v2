import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';
import { customFetch } from '@/utils/fetch-wrapper';

export type DemoDayStats = {
  liked: number;
  connected: number;
  invested: number;
  total: number;
};

async function fetcher(demoDayId: string): Promise<DemoDayStats> {
  const url = `${process.env.DIRECTORY_API_URL}/v1/demo-days/${demoDayId}/express-interest/stats`;

  const response = await customFetch(
    url,
    {
      method: 'GET',
    },
    true, // withAuth
  );

  if (!response?.ok) {
    throw new Error('Failed to fetch demo day stats');
  }

  const data: DemoDayStats = await response.json();

  return data;

  // Mock data for now
  // return new Promise((resolve) => {
  //   setTimeout(() => {
  //     resolve({
  //       introsCount: Math.floor(Math.random() * 100) + 500, // Random number between 500-600
  //       connectionsCount: Math.floor(Math.random() * 50) + 200,
  //       likesCount: Math.floor(Math.random() * 150) + 300,
  //       investmentsCount: Math.floor(Math.random() * 20) + 50,
  //     });
  //   }, 100); // Simulate network delay
  // });
}

export function useGetDemoDayStats(enabled: boolean = true) {
  const params = useParams();
  const demoDayId = params.demoDayId as string;

  return useQuery({
    queryKey: [DemoDayQueryKeys.GET_DEMO_DAY_STATS, demoDayId],
    queryFn: () => fetcher(demoDayId),
    enabled: enabled && !!demoDayId, // Only fetch when enabled and demoDayId exists
    refetchInterval: enabled ? 15000 : false, // Only refetch every 15 seconds when enabled
    refetchIntervalInBackground: true, // Continue refetching even when tab is not focused
    staleTime: 10000, // Consider data stale after 10 seconds
  });
}
