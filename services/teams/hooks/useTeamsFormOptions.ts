import { useQuery } from '@tanstack/react-query';
import { getTeamsFormOptions } from '@/services/registration.service';
import { TeamsQueryKeys } from '@/services/teams/constants';

async function fetcher() {
  return getTeamsFormOptions();
}

export function useTeamsFormOptions() {
  return useQuery({
    queryKey: [TeamsQueryKeys.GET_TEAMS_FORM_OPTIONS],
    queryFn: fetcher,
  });
}
