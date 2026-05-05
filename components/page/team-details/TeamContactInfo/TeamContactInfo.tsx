'use client';
import React from 'react';
import { useToggle } from 'react-use';

import { IUserInfo } from '@/types/shared.types';
import { ITeam } from '@/types/teams.types';

import { DetailsSection } from '@/components/common/profile/DetailsSection';

import { TeamContactInfoView } from './components/TeamContactInfoView';
import { TeamContactInfoEdit } from './components/TeamContactInfoEdit';
import { useCurrentUserStore } from '@/services/auth/store';

interface Props {
  team: ITeam;
}

export const TeamContactInfo = (props: Props) => {
  const { team } = props;
  const { currentUser } = useCurrentUserStore();
  const [isEditMode, toggleIsEditMode] = useToggle(false);

  return (
    <DetailsSection editView={isEditMode}>
      {isEditMode ? (
        <TeamContactInfoEdit team={team} toggleIsEditMode={toggleIsEditMode} />
      ) : (
        <TeamContactInfoView team={team} userInfo={currentUser} toggleIsEditMode={toggleIsEditMode} />
      )}
    </DetailsSection>
  );
};
