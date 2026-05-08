'use client';

import { useState } from 'react';
import { useToggle } from 'react-use';

import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { ITeam } from '@/types/teams.types';

import { DetailsSection } from '@/components/common/profile/DetailsSection';
import { useAllMembers } from '@/services/members/hooks/useAllMembers';

import { TeamMembersView } from './components/TeamMembersView';
import { TeamMembersAdd } from './components/TeamMembersAdd';
import { TeamMembersEditMember } from './components/TeamMembersEditMember';
import { useCurrentUserStore } from '@/services/auth/store';

interface Props {
  members: IMember[] | undefined;
  team: ITeam | undefined;
}

export function TeamMembers(props: Props) {
  const { team } = props;
  const members = props.members ?? [];
  const { currentUser: userInfo } = useCurrentUserStore();
  const [isAddMode, toggleIsAddMode] = useToggle(false);
  const [editingMember, setEditingMember] = useState<IMember | null>(null);

  // Prefetch all members so the multiselect is instant when entering edit mode
  useAllMembers();

  const isEditView = isAddMode || !!editingMember;

  const handleCloseEditMember = () => setEditingMember(null);

  if (editingMember) {
    return (
      <DetailsSection editView>
        <TeamMembersEditMember member={editingMember} members={members} team={team!} onClose={handleCloseEditMember} />
      </DetailsSection>
    );
  }

  return (
    <DetailsSection editView={isEditView}>
      {isAddMode ? (
        <TeamMembersAdd members={members} team={team!} toggleIsEditMode={toggleIsAddMode} />
      ) : (
        <TeamMembersView
          team={team}
          members={members}
          userInfo={userInfo}
          toggleIsEditMode={toggleIsAddMode}
          onEditMember={setEditingMember}
        />
      )}
    </DetailsSection>
  );
}
