import isEmpty from 'lodash/isEmpty';

import { ITeam } from '@/types/teams.types';
import { IUserInfo } from '@/types/shared.types';
import { FocusAreasMap } from '@/components/page/team-details/TeamFocusAreas/hooks/useGetFocusAreasToDisplay';

import { isTeamLeaderOrAdmin } from '@/components/page/team-details/utils/isTeamLeaderOrAdmin';

import {
  NoDataBlock,
  DetailsSectionHeader,
  DetailsSectionGreyContentContainer,
} from '@/components/common/profile/DetailsSection';
import { EditButton } from '@/components/common/profile/EditButton';

import { SingleTeamFocusArea } from './components/SingleTeamFocusArea';

interface Props {
  team: ITeam;
  userInfo: IUserInfo;
  focusAreas: FocusAreasMap;
  toggleIsEditMode: () => void;
}

export function TeamFocusAreasView(props: Props) {
  const { team, userInfo, focusAreas, toggleIsEditMode } = props;

  const canEdit = isTeamLeaderOrAdmin(userInfo, team?.id);
  const focusAreaEntries = Object.values(focusAreas);

  return (
    <>
      <DetailsSectionHeader title="Focus Areas">
        {canEdit && <EditButton onClick={toggleIsEditMode} />}
      </DetailsSectionHeader>
      <DetailsSectionGreyContentContainer>
        {isEmpty(focusAreaEntries) ? (
          <NoDataBlock>No focus area added.</NoDataBlock>
        ) : (
          focusAreaEntries.map((area) => <SingleTeamFocusArea key={area.uid} focusArea={area} />)
        )}
      </DetailsSectionGreyContentContainer>
    </>
  );
}
