'use client';
import React from 'react';
import { useToggle } from 'react-use';

import { IUserInfo } from '@/types/shared.types';
import { ITeam } from '@/types/teams.types';

import { DetailsSection } from '@/components/common/profile/DetailsSection';

import { TeamContactInfoView } from './components/TeamContactInfoView';
import { TeamContactInfoEdit } from './components/TeamContactInfoEdit';

interface Props {
  team: ITeam | undefined;
  userInfo: IUserInfo | undefined;
}

export const TeamContactInfo = (props: Props) => {
  const { team, userInfo } = props;

  const [isEditMode, toggleIsEditMode] = useToggle(false);

  console.log('>>>', team);

  return (
    <DetailsSection editView={isEditMode}>
      {isEditMode ? (
        <TeamContactInfoEdit team={team} toggleIsEditMode={toggleIsEditMode} />
      ) : (
        <TeamContactInfoView team={team} userInfo={userInfo} toggleIsEditMode={toggleIsEditMode} />
      )}
    </DetailsSection>
  );
};
