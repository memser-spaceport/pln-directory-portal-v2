import { ITeam } from '@/types/teams.types';

import { IUserInfo } from '@/types/shared.types';

import { isTeamLeaderOrAdmin } from '@/components/page/team-details/utils/isTeamLeaderOrAdmin';

import { TeamsTagsListSection } from '../TeamsTagsListSection';

interface Props {
  team: ITeam;
  userInfo: IUserInfo;
}

export function TeamMembershipSource(props: Props) {
  const { team, userInfo } = props;

  const isTLOrAdmin = isTeamLeaderOrAdmin(userInfo, team?.id);

  if (isTLOrAdmin) {
    return (
      <TeamsTagsListSection
        tags={team?.membershipSources}
        title="Membership Source"
        emptyMessage="No membership source added."
      />
    );
  }

  return null;
}
