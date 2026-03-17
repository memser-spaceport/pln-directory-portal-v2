'use client';

import isEmpty from 'lodash/isEmpty';

import { ITeam } from '@/types/teams.types';
import { IUserInfo } from '@/types/shared.types';

import { isTeamLeaderOrAdmin } from '@/components/page/team-details/utils/isTeamLeaderOrAdmin';

import { useGetTeamTagsListOptions } from './hooks/useGetTeamTagsListOptions';
import { useGetTeamTagsListEditOptions } from './hooks/useGetTeamTagsListEditOptions';

import { TeamsTagsListSection } from './TeamsTagsListSection';

interface Props {
  team: ITeam;
  userInfo: IUserInfo;
}

export function TeamCommunitiesSection(props: Props) {
  const { team, userInfo } = props;

  const { membershipSources: tags = [] } = team || {};

  const isTLOrAdmin = isTeamLeaderOrAdmin(userInfo, team?.id);

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
