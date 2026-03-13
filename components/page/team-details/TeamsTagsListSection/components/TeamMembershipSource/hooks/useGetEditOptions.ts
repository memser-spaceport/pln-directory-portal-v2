import { useTeamsFormOptions } from '@/services/teams/hooks/useTeamsFormOptions';
import { useMemo } from 'react';
import map from 'lodash/map';

export function useGetEditOptions() {
  const { data } = useTeamsFormOptions();

  const options = useMemo(() => {
    return map(data?.membershipSources, (item: { id: string; name: string }) => {
      const { id, name } = item;

      return {
        label: name,
        value: id,
      };
    });
  }, [data]);

  return options;
}
