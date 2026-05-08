import { useMemo } from 'react';

import { IJobTeam } from '@/types/jobs.types';
import { useJobsFilterStore } from '@/services/jobs/store';
import { URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';

export function useGetFocusTags(team: IJobTeam) {
  const { focusAreas, subFocusAreas } = team;

  const { params } = useJobsFilterStore();
  const rawFocusFilter = params.get('focus');

  return useMemo(() => {
    const teamFocusAreas = focusAreas.filter((f) => !subFocusAreas.includes(f));
    const focusFilter = rawFocusFilter ? rawFocusFilter.split(URL_QUERY_VALUE_SEPARATOR).filter(Boolean) : [];

    const teamSubFocusAreas = subFocusAreas.filter((t) => focusFilter.includes(t));

    return [
      ...teamFocusAreas.map((title) => ({ title, color: '' })),
      ...teamSubFocusAreas.map((title) => ({ title, color: '' })),
    ];
  }, [focusAreas, subFocusAreas, rawFocusFilter]);
}
