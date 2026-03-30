import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';
import { customFetch } from '@/utils/fetch-wrapper';

export type TeamFundraisingProfileResponse = {
  uid: string;
  teamUid: string;
  analyticsReportUrl?: string;
};

async function fetcher(demoDayId: string, teamUid: string): Promise<TeamFundraisingProfileResponse | null> {
  const url = `${process.env.DIRECTORY_API_URL}/v1/demo-days/${demoDayId}/teams/${teamUid}/fundraising-profile`;

  const response = await customFetch(
    url,
    {
      method: 'GET',
    },
    true,
  );

  if (!response?.ok) {
    return null;
  }

  return response.json();
}

export function useGetTeamFundraisingProfile(enabled: boolean = true) {
  const params = useParams();
  const demoDayId = params.demoDayId as string;
  const teamUid = params.teamUid as string;

  return useQuery({
    queryKey: [DemoDayQueryKeys.GET_TEAM_FUNDRAISING_PROFILE, demoDayId, teamUid],
    queryFn: () => fetcher(demoDayId, teamUid),
    enabled: enabled && !!demoDayId && !!teamUid,
  });
}
