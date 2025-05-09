import { useQuery } from '@tanstack/react-query';
import { TeamsQueryKeys } from '@/services/teams/constants';
import { ITeamAsk } from '@/types/teams.types';

async function fetcher(teamId: string | undefined) {
  if (!teamId) {
    return null;
  }

  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/teams/${teamId}`, { cache: 'no-store' });

  if (response?.ok) {
    const result = await response.json();

    return result.asks as ITeamAsk[];
  }
}

export function useTeamAsks(teamId: string | undefined) {
  return useQuery({
    queryKey: [TeamsQueryKeys.GET_ASKS, teamId],
    queryFn: () => fetcher(teamId),
    enabled: !!teamId,
  });
}
