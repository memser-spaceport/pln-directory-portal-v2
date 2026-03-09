'use client';

import React from 'react';

import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';

import { getAccessLevel } from '@/utils/auth.utils';
import { isAdminUser } from '@/utils/user/isAdminUser';

import { DetailsSection } from '@/components/common/profile/DetailsSection';
import { RepositoriesList } from '@/components/page/member-details/RepositoriesDetails/components/RepositoriesList';


interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
}

export const RepositoriesDetails = ({ isLoggedIn, userInfo, member }: Props) => {
  const isAdmin = isAdminUser(userInfo)
  const isOwner = userInfo?.uid === member.id;
  const isEditable = isOwner || isAdmin;

  if (!isLoggedIn || (getAccessLevel(userInfo, isLoggedIn) !== 'advanced' && !isOwner)) {
    return null;
  }

  return (
    <DetailsSection>
      <RepositoriesList member={member} userInfo={userInfo} isEditable={isEditable} />
    </DetailsSection>
  );
};
