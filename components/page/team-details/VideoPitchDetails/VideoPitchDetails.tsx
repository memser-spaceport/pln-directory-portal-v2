'use client';

import { clsx } from 'clsx';
import React, { useState } from 'react';

import { ITeam } from '@/types/teams.types';
import { IUserInfo } from '@/types/shared.types';

import { isAdminUser } from '@/utils/user/isAdminUser';

import { useMobileNavVisibility } from '@/hooks/useMobileNavVisibility';

import { VideoPitchView } from '@/components/page/team-details/VideoPitchDetails/components/VideoPitchView';
import { EditVideoPitchForm } from '@/components/page/team-details/VideoPitchDetails/components/EditVideoPitchForm';

import s from './VideoPitchDetails.module.scss';

interface Props {
  team: ITeam;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
}

export const VideoPitchDetails = ({ isLoggedIn, userInfo, team }: Props) => {
  const [editView, setEditView] = useState(false);
  const isAdmin = isAdminUser(userInfo);
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
        <EditVideoPitchForm onClose={() => setEditView(false)} team={team} userInfo={userInfo} />
      ) : (
        <VideoPitchView
          isLoggedIn={isLoggedIn}
          isEditable={isEditable}
          showIncomplete={showIncomplete}
          onEdit={() => setEditView(true)}
        />
      )}
    </div>
  );
};
