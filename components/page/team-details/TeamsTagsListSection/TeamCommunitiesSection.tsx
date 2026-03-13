import isEmpty from 'lodash/isEmpty';

import { ITeam } from '@/types/teams.types';

import { IUserInfo } from '@/types/shared.types';

import { isTeamLeaderOrAdmin } from '@/components/page/team-details/utils/isTeamLeaderOrAdmin';

import { TeamsTagsListSectionView } from './components/TeamsTagsListSectionView/TeamsTagsListSectionView';

interface Props {
  team: ITeam;
  userInfo: IUserInfo;
}

export function TeamCommunitiesSection(props: Props) {
  const { team, userInfo } = props;

  const { membershipSources: tags = [] } = team || {};

  const isTLOrAdmin = isTeamLeaderOrAdmin(userInfo, team?.id);

  // if (!isEmpty(tags)) {
  //   return (
  //     <TeamsTagsListSectionView tags={team?.membershipSources} title="Community Affiliations" emptyMessage="No communities added." />
  //   );
  // }

  return null;
}
