import { useTeamFilterStore } from '@/services/teams';
import { ITeamsSearchParams } from '@/types/teams.types';

export function useGetTeamsFilterAsObjectFromStore() {
  const { params } = useTeamFilterStore();

  return Object.fromEntries(params.entries()) as unknown as ITeamsSearchParams;
}
