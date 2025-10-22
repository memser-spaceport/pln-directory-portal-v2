'use client';

import React, { useState } from 'react';

import { clsx } from 'clsx';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { ADMIN_ROLE } from '@/utils/constants';

import s from './TeamsDetails.module.scss';
import { getAccessLevel } from '@/utils/auth.utils';
import { ITeam } from '@/types/teams.types';
import { TeamsList } from '@/components/page/member-details/TeamsDetails/components/TeamsList';
import { EditTeamForm } from '@/components/page/member-details/TeamsDetails/components/EditTeamForm';
import { useMobileNavVisibility } from '@/hooks/useMobileNavVisibility';

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
}

export const TeamsDetails = ({ isLoggedIn, userInfo, member }: Props) => {
  const [view, setView] = useState<'view' | 'add' | 'edit'>('view');
  const [selectedItem, setSelectedItem] = useState<null | ITeam>(null);
  const isAdmin = !!(userInfo?.roles && userInfo?.roles?.length > 0 && userInfo?.roles.includes(ADMIN_ROLE));
  const isOwner = userInfo?.uid === member.id;
  const isEditable = isOwner || isAdmin;
  useMobileNavVisibility(view !== 'view');

  if (!isLoggedIn || (getAccessLevel(userInfo, isLoggedIn) !== 'advanced' && !isOwner)) {
    return null;
  }

  return (
    <div
      className={clsx(s.root, {
        [s.editView]: view !== 'view',
      })}
    >
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
    </div>
  );
};
