import isEmpty from 'lodash/isEmpty';

import { ITeam } from '@/types/teams.types';

import { IUserInfo } from '@/types/shared.types';

import { isTeamLeaderOrAdmin } from '@/components/page/team-details/utils/isTeamLeaderOrAdmin';

import { TeamsTagsListSection } from '../TeamsTagsListSection';

interface Props {
  team: ITeam;
  userInfo: IUserInfo;
}

export function TeamCommunitiesSection(props: Props) {
  const { team, userInfo } = props;

  const { membershipSources: tags = [] } = team || {};

  const isTLOrAdmin = isTeamLeaderOrAdmin(userInfo, team?.id);

  if (isTLOrAdmin || !isEmpty(tags)) {
    return (
      <TeamsTagsListSection tags={team?.membershipSources} title="Communities" emptyMessage="No communities added." />
    );
  }

  return null;
}
