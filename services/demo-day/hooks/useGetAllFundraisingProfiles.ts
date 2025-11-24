import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';
import { customFetch } from '@/utils/fetch-wrapper';
import { TeamProfile } from './useGetTeamsList';

async function fetcher(demoDayId: string): Promise<TeamProfile[]> {
  const url = `${process.env.DIRECTORY_API_URL}/v1/admin/demo-days/${demoDayId}/fundraising-profiles`;

  const response = await customFetch(
    url,
    {
      method: 'GET',
    },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to fetch all fundraising profiles');
  }

  return await response.json();
}

export function useGetAllFundraisingProfiles() {
  const params = useParams();
  const demoDayId = params.demoDayId as string;

  return useQuery({
    queryKey: [DemoDayQueryKeys.GET_ALL_FUNDRAISING_PROFILES, demoDayId],
    queryFn: () => fetcher(demoDayId),
    enabled: !!demoDayId,
  });
}
