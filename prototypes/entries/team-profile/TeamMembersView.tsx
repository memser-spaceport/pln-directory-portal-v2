'use client';

import isEmpty from 'lodash/isEmpty';

import type { IMember } from '@/types/members.types';
import type { ITeam } from '@/types/teams.types';

import {
  NoDataBlock,
  DetailsSection,
  DetailsSectionHeader,
  DetailsSectionGreyContentContainer,
} from '@/components/common/profile/DetailsSection';

// Import the production leaf member card directly (clean — no store/analytics).
import { TeamMembersViewCard } from '@/components/page/team-details/TeamMembers/components/TeamMembersView/components/TeamMembersViewCard';

import s from '@/components/page/team-details/TeamMembers/components/TeamMembersView/TeamMembersView.module.scss';

interface Props {
  team: ITeam;
  members: IMember[];
}

/**
 * COPY-SIMPLIFY of production `TeamMembers` + `TeamMembersView`.
 * Production reads `useCurrentUserStore`, prefetches via `useAllMembers`
 * (react-query) and fires `useTeamAnalytics`; the "Show All" opens a Modal.
 * We strip all of that and render the read view with mock members, importing
 * the clean `TeamMembersViewCard` leaf and production scss. `hasEditAccess` is
 * hardcoded false (approved-but-not-lead viewer).
 */
export function TeamMembersView({ team, members }: Props) {
  const teamId = team?.id;
  const membersCount = members?.length || 0;
  const noMembers = isEmpty(members);

  return (
    <DetailsSection>
      <DetailsSectionHeader title={noMembers ? 'Members' : `Members (${membersCount})`} />

      {noMembers ? (
        <DetailsSectionGreyContentContainer>
          <NoDataBlock>Add members associated with this team.</NoDataBlock>
        </DetailsSectionGreyContentContainer>
      ) : (
        <div className={s.membersList}>
          {members.map((member, index) => (
            <TeamMembersViewCard
              key={member.id ?? index}
              member={member}
              teamId={teamId || ''}
              showBorder={index < membersCount - 1}
              hasEditAccess={false}
              onClick={() => {}}
              onEdit={() => {}}
            />
          ))}
        </div>
      )}
    </DetailsSection>
  );
}
