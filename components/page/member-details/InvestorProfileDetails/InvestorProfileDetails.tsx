'use client';

import React, { useState } from 'react';
import { clsx } from 'clsx';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { ADMIN_ROLE } from '@/utils/constants';
import { EditInvestorProfileForm } from '@/components/page/member-details/InvestorProfileDetails/components/EditInvestorProfileForm';
import { InvestorProfileView } from '@/components/page/member-details/InvestorProfileDetails/components/InvestorProfileView';
import { useMobileNavVisibility } from '@/hooks/useMobileNavVisibility';

import s from './InvestorProfileDetails.module.scss';

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
}

export const InvestorProfileDetails = ({ isLoggedIn, userInfo, member }: Props) => {
  const [editView, setEditView] = useState(false);
  const isAdmin = !!(userInfo?.roles && userInfo?.roles?.length > 0 && userInfo?.roles.includes(ADMIN_ROLE));
  const isOwner = userInfo?.uid === member.id;
  const isEditable = isOwner || isAdmin;

  // Mock data - replace with actual member properties when available
  const hasInvestorProfile = !!(member as any)?.typicalCheckSize || !!(member as any)?.investmentFocusAreas?.length || !!(member as any)?.displayAsInvestor;
  const showWarningUseCaseA = !hasInvestorProfile;
  const showIncomplete = !editView && isOwner && showWarningUseCaseA;

  useMobileNavVisibility(editView);

  if (!isLoggedIn) {
    return null;
  }

  if (!isEditable && !hasInvestorProfile) {
    return null;
  }

  if (!isAdmin && member.accessLevel !== 'InvestorOnly' && member.accessLevel !== 'InvestorAndMember') {
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
        <EditInvestorProfileForm onClose={() => setEditView(false)} member={member} userInfo={userInfo} />
      ) : (
        <InvestorProfileView member={member} isLoggedIn={isLoggedIn} userInfo={userInfo} isEditable={isEditable} showIncomplete={showIncomplete} onEdit={() => setEditView(true)} />
      )}
    </div>
  );
};
