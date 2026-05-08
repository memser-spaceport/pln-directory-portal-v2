'use client';

import isEmpty from 'lodash/isEmpty';

import { ITeam } from '@/types/teams.types';
import { IUserInfo } from '@/types/shared.types';

import { isTeamLeaderOrAdmin } from '@/components/page/team-details/utils/isTeamLeaderOrAdmin';

import { useGetTeamTagsListOptions } from './hooks/useGetTeamTagsListOptions';
import { useGetTeamTagsListEditOptions } from './hooks/useGetTeamTagsListEditOptions';

import { TeamsTagsListSection } from './TeamsTagsListSection';
import { useCurrentUserStore } from '@/services/auth/store';

interface Props {
  team: ITeam;
}

export function TeamCommunitiesSection(props: Props) {
  const { team } = props;

  const { currentUser } = useCurrentUserStore();
  const { membershipSources: tags = [] } = team || {};

  const isTLOrAdmin = isTeamLeaderOrAdmin(currentUser, team?.id);

  const communityAffiliations = useGetTeamTagsListOptions(team, 'communityAffiliations');
  const availableCommunityAffiliations = useGetTeamTagsListEditOptions('communityAffiliations');

  if (!isEmpty(tags) || isTLOrAdmin) {
    return (
      <TeamsTagsListSection
        team={team}
        view={{
          canEdit: isTLOrAdmin,
          tags: team?.communityAffiliations,
          title: 'Community Affiliations',
          emptyMessage: 'No community affiliations.',
        }}
        edit={{
          title: 'Edit Community Affiliations',
          label: 'Select Community Affiliations',
          placeholder: 'Select the Community Affiliations',
          selectedOptions: communityAffiliations,
          options: availableCommunityAffiliations,
          dataKey: 'communityAffiliations',
        }}
      />
    );
  }

  return null;
}
