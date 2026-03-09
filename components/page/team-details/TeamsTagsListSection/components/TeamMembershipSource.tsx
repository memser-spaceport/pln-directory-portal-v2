import { ITeam } from '@/types/teams.types';

import { IUserInfo } from '@/types/shared.types';

import { isAdminUser } from '@/utils/user/isAdminUser';
import { isTierUser } from '@/utils/user/isTierUser';

import { TeamsTagsListSection } from '../TeamsTagsListSection';

interface Props {
  team: ITeam;
  userInfo: IUserInfo;
}

export function TeamMembershipSource(props: Props) {
  const { team, userInfo } = props;

  const canView = isTierUser(userInfo) || isAdminUser(userInfo);

  if (canView) {
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
