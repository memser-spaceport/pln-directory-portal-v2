import map from 'lodash/map';
import { useMemo } from 'react';
import reduce from 'lodash/reduce';

import { IFocusArea } from '@/types/shared.types';
import { ITeamFocusAres } from '@/components/page/team-details/TeamFocusAreas/types';

export type FocusAreasMap = Record<
  string,
  {
    uid: string;
    title: string;
    children: ITeamFocusAres[];
  }
>;

export function useGetFocusAreasToDisplay(focusAreas: IFocusArea[], teamFocusAres: ITeamFocusAres[]) {
  return useMemo(() => {
    return reduce(
      focusAreas,
      (acc: FocusAreasMap, focusAreaGroup) => {
        const { uid, title, children } = focusAreaGroup;

        const childrenUids = map(children, 'uid');

        teamFocusAres.forEach((focusArea) => {
          if (childrenUids.includes(focusArea.uid)) {
            if (!acc[uid]) {
              acc[uid] = {
                uid,
                title,
                children: [],
              };
            }

            acc[uid].children.push(focusArea);
          }
        });

        return acc;
      },
      {},
    );
  }, [focusAreas, teamFocusAres]);
}
