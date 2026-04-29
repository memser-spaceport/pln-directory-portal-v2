import { useMemo } from 'react';
import { IJobTeam } from '@/types/jobs.types';

const TAG_BG_COLOR = 'rgba(21,111,247,.06)';

export function useGetFocusTags(team: IJobTeam) {
  return useMemo(() => {
    const dedupedSub = team.subFocusAreas.filter((t) => !team.focusAreas.includes(t));
    return [
      ...team.focusAreas.map((title) => ({ title, color: '' })),
      ...dedupedSub.map((title) => ({ title, color: '' })),
    ];
  }, [team.focusAreas, team.subFocusAreas]);
}
