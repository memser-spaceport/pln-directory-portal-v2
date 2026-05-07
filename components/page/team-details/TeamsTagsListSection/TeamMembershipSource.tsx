'use client';

import { ITeam } from '@/types/teams.types';
import { IUserInfo } from '@/types/shared.types';

import { isAdminUser } from '@/utils/user/isAdminUser';

import { useGetTeamTagsListOptions } from './hooks/useGetTeamTagsListOptions';
import { useGetTeamTagsListEditOptions } from './hooks/useGetTeamTagsListEditOptions';

import { TeamsTagsListSection } from './TeamsTagsListSection';
import { useCurrentUserStore } from '@/services/auth/store';

interface Props {
  team: ITeam;
}

export function TeamMembershipSource(props: Props) {
  const { team } = props;
  const { currentUser } = useCurrentUserStore();
  const canViewContent = currentUser?.rbac?.effectivePermissions.some((p) => p.code === 'membership.source.read');
  const canEditContent = currentUser?.rbac?.effectivePermissions.some((p) => p.code === 'membership.source.write');
  const isAdmin = isAdminUser(currentUser);

  const canView = canViewContent || isAdmin;
  const canEdit = canEditContent || isAdmin;

  const membershipSources = useGetTeamTagsListOptions(team, 'membershipSources');
  const availableMembershipSources = useGetTeamTagsListEditOptions('membershipSources');

  if (canView) {
    return (
      <TeamsTagsListSection
        team={team}
        view={{
          canEdit,
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
