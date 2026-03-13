'use client';

import React, { useState } from 'react';

import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';

import { getAccessLevel } from '@/utils/auth.utils';
import { ITeam } from '@/types/teams.types';
import { TeamsList } from '@/components/page/member-details/TeamsDetails/components/TeamsList';
import { EditTeamForm } from '@/components/page/member-details/TeamsDetails/components/EditTeamForm';
import { useMobileNavVisibility } from '@/hooks/useMobileNavVisibility';
import { DetailsSection } from '@/components/common/profile/DetailsSection';
import { isAdminUser } from '@/utils/user/isAdminUser';

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
}

export const TeamsDetails = ({ isLoggedIn, userInfo, member }: Props) => {
  const [view, setView] = useState<'view' | 'add' | 'edit'>('view');
  const [selectedItem, setSelectedItem] = useState<null | ITeam>(null);
  const isAdmin = isAdminUser(userInfo);
  const isOwner = userInfo?.uid === member.id;
  const isEditable = isOwner || isAdmin;
  useMobileNavVisibility(view !== 'view');

  if (!isLoggedIn || (getAccessLevel(userInfo, isLoggedIn) !== 'advanced' && !isOwner)) {
    return null;
  }

  return (
    <DetailsSection editView={view !== 'view'}>
      {view === 'view' && (
        <TeamsList
          member={member}
          userInfo={userInfo}
          isEditable={isEditable}
          onAdd={() => {
            setView('add');
          }}
          onEdit={(item) => {
            setSelectedItem(item);
            setView('edit');
          }}
        />
      )}
      {view === 'edit' && <EditTeamForm onClose={() => setView('view')} member={member} initialData={selectedItem} />}
      {view === 'add' && <EditTeamForm onClose={() => setView('view')} member={member} />}
    </DetailsSection>
  );
};
