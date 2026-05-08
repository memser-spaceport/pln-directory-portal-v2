'use client';

import React from 'react';

import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';

import { isAdminUser } from '@/utils/user/isAdminUser';

import { DetailsSection } from '@/components/common/profile/DetailsSection';
import { RepositoriesList } from '@/components/page/member-details/RepositoriesDetails/components/RepositoriesList';

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo | null;
}

export const RepositoriesDetails = ({ isLoggedIn, userInfo, member }: Props) => {
  const isAdmin = isAdminUser(userInfo);
  const isOwner = userInfo?.uid === member.id;
  const canView = userInfo?.rbac?.status === 'APPROVED';
  const isEditable = isOwner || isAdmin;

  if (!isLoggedIn || (!canView && !isOwner)) {
    return null;
  }

  return (
    <DetailsSection>
      <RepositoriesList member={member} userInfo={userInfo!} isEditable={isEditable} />
    </DetailsSection>
  );
};
