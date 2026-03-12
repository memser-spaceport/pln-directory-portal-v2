import { ITeam } from '@/types/teams.types';
import { useMemo } from 'react';

export function useGetTeamMembershipOptions(team: ITeam) {
  const options = useMemo(() => {
    return (
      team?.membershipSources?.map((item) => {
        const { uid, title } = item;

        return {
          label: title,
          value: uid,
        };
      }) || []
    );
  }, [team?.membershipSources]);

  return options;
}
