'use client';

import React from 'react';

import { clsx } from 'clsx';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { ADMIN_ROLE } from '@/utils/constants';

import { RepositoriesList } from '@/components/page/member-details/RepositoriesDetails/components/RepositoriesList';

import s from './RepositoriesDetails.module.scss';
import { getAccessLevel } from '@/utils/auth.utils';

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
}

export const RepositoriesDetails = ({ isLoggedIn, userInfo, member }: Props) => {
  const isAdmin = !!(userInfo?.roles && userInfo?.roles?.length > 0 && userInfo?.roles.includes(ADMIN_ROLE));
  const isOwner = userInfo?.uid === member.id;
  const isEditable = isOwner || isAdmin;

  if (!isLoggedIn || getAccessLevel(userInfo, isLoggedIn) !== 'advanced') {
    return null;
  }

  return (
    <div className={clsx(s.root)}>
      <RepositoriesList member={member} userInfo={userInfo} isEditable={isEditable} />
    </div>
  );
};
