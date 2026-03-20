import map from 'lodash/map';
import get from 'lodash/get';
import { useMemo } from 'react';

import { useTeamsFormOptions } from '@/services/teams/hooks/useTeamsFormOptions';

export function useGetTeamTagsListEditOptions(key: string) {
  const { data } = useTeamsFormOptions();

  const options = useMemo(() => {
    const opts = get(data, key);

    return map(opts, (item: { id: string; name: string }) => {
      const { id, name } = item;

      return {
        label: name,
        value: id,
      };
    });
  }, [key, data]);

  return options;
}
