'use client';

import React, { useState } from 'react';
import { clsx } from 'clsx';
import { IUserInfo } from '@/types/shared.types';
import { useMobileNavVisibility } from '@/hooks/useMobileNavVisibility';

import s from './PitchDeckDetails.module.scss';
import { PitchDeckView } from '@/components/page/team-details/PitchDeckDetails/components/PitchDeckView';
import { EditPitchDeckForm } from '@/components/page/team-details/PitchDeckDetails/components/EditPitchDeckForm';
import { ITeam } from '@/types/teams.types';
import { isAdminUser } from '@/utils/user/isAdminUser';

interface Props {
  team: ITeam;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
}

export const PitchDeckDetails = ({ isLoggedIn, userInfo, team }: Props) => {
  const [editView, setEditView] = useState(false);
  const isAdmin = isAdminUser(userInfo)
  const isEditable = userInfo?.leadingTeams?.includes(team?.id) || isAdmin;

  const showWarningUseCaseA = true;
  const showIncomplete = true;

  useMobileNavVisibility(editView);

  if (!isLoggedIn) {
    return null;
  }

  if (!isEditable) {
    return null;
  }

  return (
    <div
      className={clsx(s.root, {
        [s.editView]: editView,
        [s.missingData]: showIncomplete,
      })}
    >
      {editView ? (
        <EditPitchDeckForm onClose={() => setEditView(false)} team={team} userInfo={userInfo} />
      ) : (
        <PitchDeckView
          isLoggedIn={isLoggedIn}
          isEditable={isEditable}
          showIncomplete={showIncomplete}
          onEdit={() => setEditView(true)}
        />
      )}
    </div>
  );
};
