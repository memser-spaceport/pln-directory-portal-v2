'use client';
import { useMemo } from 'react';
import isEmpty from 'lodash/isEmpty';
import { useToggle } from 'react-use';

import { ITeam } from '@/types/teams.types';
import { IFocusArea, IUserInfo } from '@/types/shared.types';

import { sortFocusAreas } from '@/utils/sortFocusAreas';
import { isTeamLeaderOrAdmin } from '@/components/page/team-details/utils/isTeamLeaderOrAdmin';

import { DetailsSection } from '@/components/common/profile/DetailsSection';

import { ITeamFocusAres } from './types';

import { useGetFocusAreasToDisplay } from './hooks/useGetFocusAreasToDisplay';

import { TeamFocusAreasEdit } from './components/TeamFocusAreasEdit';
import { TeamFocusAreasView } from './components/TeamFocusAreasView';

interface Props {
  team: ITeam;
  userInfo: IUserInfo;
  focusAreas: IFocusArea[];
  teamFocusAreas: ITeamFocusAres[];
}

export function TeamFocusAreas(props: Props) {
  const { team, userInfo, focusAreas, teamFocusAreas } = props;

  const [isEditMode, toggleIsEditMode] = useToggle(false);

  const sortedFocusAreas = useMemo(() => sortFocusAreas(focusAreas), [focusAreas]);

  const teamFocusAreasToDisplay = useGetFocusAreasToDisplay(sortedFocusAreas, teamFocusAreas);

  const hasTeamEditAccess = isTeamLeaderOrAdmin(userInfo, team?.id);

  if (isEmpty(teamFocusAreas) && !hasTeamEditAccess) {
    return null;
  }

  return (
    <DetailsSection editView={isEditMode}>
      {isEditMode ? (
        <TeamFocusAreasEdit team={team} focusAreas={sortedFocusAreas} toggleIsEditMode={toggleIsEditMode} />
      ) : (
        <TeamFocusAreasView
          team={team}
          userInfo={userInfo}
          focusAreas={teamFocusAreasToDisplay}
          toggleIsEditMode={toggleIsEditMode}
        />
      )}
    </DetailsSection>
  );
}
