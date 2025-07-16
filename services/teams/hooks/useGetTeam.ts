import { useQuery } from '@tanstack/react-query';
import { TeamsQueryKeys } from '@/services/teams/constants';
import { getTeam } from '@/services/teams.service';

async function fetcher(id: string | undefined) {
  if (!id) {
    return null;
  }

  const teamResponse = await getTeam(id, { with: 'logo' });

  if (teamResponse.error) {
    return null;
  }

  return teamResponse.data.formatedData;
}

export function useGetTeam(id: string | undefined) {
  return useQuery({
    queryKey: [TeamsQueryKeys.GET_TEAM, id],
    queryFn: () => fetcher(id),
    enabled: !!id,
  });
}
