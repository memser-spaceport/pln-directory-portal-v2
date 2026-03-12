'use client';

import { ITeam } from '@/types/teams.types';

import { IUserInfo } from '@/types/shared.types';

import { isAdminUser } from '@/utils/user/isAdminUser';
import { isTierUser } from '@/utils/user/isTierUser';

import { useGetEditOptions } from './hooks/useGetEditOptions';
import { useGetTeamMembershipOptions } from './hooks/useGetTeamMembershipOptions';

import { TeamsTagsListSection } from '../../TeamsTagsListSection';

interface Props {
  team: ITeam;
  userInfo: IUserInfo;
}

export function TeamMembershipSource(props: Props) {
  const { team, userInfo } = props;

  const canView = isTierUser(userInfo) || isAdminUser(userInfo) || true;

  const availableMembershipSources = useGetEditOptions();
  const membershipSources = useGetTeamMembershipOptions(team);

  if (canView) {
    return (
      <TeamsTagsListSection
        team={team}
        view={{
          tags: team?.membershipSources,
          title: 'Membership Source',
          emptyMessage: 'No membership source added.',
        }}
        edit={{
          title: 'Edit Membership Source',
          label: 'Select Membership Source',
          placeholder: 'Select the Membership Sources',
          selectedOptions: membershipSources,
          options: availableMembershipSources,
          dataKey: 'membershipSources',
        }}
      />
    );
  }

  return null;
}
