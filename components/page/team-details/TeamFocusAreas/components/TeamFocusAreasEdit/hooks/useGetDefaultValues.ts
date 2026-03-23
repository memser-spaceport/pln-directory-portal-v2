import { useMemo } from 'react';
import { ITeam } from '@/types/teams.types';
import { IFocusArea } from '@/types/shared.types';

import { FormValues } from '../types';

type Input = {
  team: ITeam;
  focusAreas: IFocusArea[];
};

export function useGetDefaultValues(input: Input) {
  const { team, focusAreas } = input;

  const teamFocusAreaUids = useMemo(
    () => new Set((team.teamFocusAreas || []).map((fa: { uid: string }) => fa.uid)),
    [team.teamFocusAreas],
  );

  const defaultValues = useMemo(() => {
    const values: FormValues = {};
    focusAreas.forEach((parent) => {
      values[parent.uid] = (parent.children || [])
        .filter((child) => teamFocusAreaUids.has(child.uid))
        .map((child) => ({ label: child.title, value: child.uid }));
    });

    return values;
  }, [focusAreas, teamFocusAreaUids]);

  return defaultValues;
}
