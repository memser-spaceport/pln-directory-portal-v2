'use client';
import { useToggle } from 'react-use';

import { ITeam } from '@/types/teams.types';
import { IFocusArea, IUserInfo } from '@/types/shared.types';

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

  const teamFocusAreasToDisplay = useGetFocusAreasToDisplay(focusAreas, teamFocusAreas);

  return (
    <DetailsSection editView={isEditMode}>
      {isEditMode ? (
        <TeamFocusAreasEdit team={team} focusAreas={focusAreas} toggleIsEditMode={toggleIsEditMode} />
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
