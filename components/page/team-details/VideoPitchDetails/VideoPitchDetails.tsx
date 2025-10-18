'use client';

import React, { useState } from 'react';
import { clsx } from 'clsx';
import { IUserInfo } from '@/types/shared.types';
import { ADMIN_ROLE } from '@/utils/constants';
import { useMobileNavVisibility } from '@/hooks/useMobileNavVisibility';

import s from './VideoPitchDetails.module.scss';
import { ITeam } from '@/types/teams.types';
import { VideoPitchView } from '@/components/page/team-details/VideoPitchDetails/components/VideoPitchView';
import { EditVideoPitchForm } from '@/components/page/team-details/VideoPitchDetails/components/EditVideoPitchForm';

interface Props {
  team: ITeam;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
}

export const VideoPitchDetails = ({ isLoggedIn, userInfo, team }: Props) => {
  const [editView, setEditView] = useState(false);
  const isAdmin = !!(userInfo?.roles && userInfo?.roles?.length > 0 && userInfo?.roles.includes(ADMIN_ROLE));
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
