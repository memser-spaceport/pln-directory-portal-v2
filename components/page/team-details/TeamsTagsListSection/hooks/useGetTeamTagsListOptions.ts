import get from 'lodash/get';
import map from 'lodash/map';
import { useMemo } from 'react';

import { ITeam } from '@/types/teams.types';

export function useGetTeamTagsListOptions(team: ITeam, key: string) {
  const options = useMemo(() => {
    const opts = get(team, key);

    return (
      map(opts, (item) => {
        const { uid, title } = item;

        return {
          label: title,
          value: uid,
        };
      }) || []
    );
  }, [team]);

  return options;
}
