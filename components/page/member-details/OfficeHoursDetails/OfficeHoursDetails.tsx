'use client';

import React, { useState } from 'react';
import { clsx } from 'clsx';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { ADMIN_ROLE } from '@/utils/constants';
import { EditOfficeHoursForm } from '@/components/page/member-details/OfficeHoursDetails/components/EditOfficeHoursForm';
import { OfficeHoursView } from '@/components/page/member-details/OfficeHoursDetails/components/OfficeHoursView';
import { useMobileNavVisibility } from '@/hooks/useMobileNavVisibility';

import s from './OfficeHoursDetails.module.scss';
import { useValidateOfficeHoursQuery } from '@/services/members/hooks/useValidateOfficeHoursQuery';

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
}

export const OfficeHoursDetails = ({ isLoggedIn, userInfo, member }: Props) => {
  const [editView, setEditView] = useState(false);
  const isAdmin = !!(userInfo?.roles && userInfo?.roles?.length > 0 && userInfo?.roles.includes(ADMIN_ROLE));
  const isOwner = userInfo?.uid === member.id;
  const isEditable = isOwner || isAdmin;
  const showWarningUseCaseA = !member?.officeHours;
  const showWarningUseCaseB = !member?.ohInterest?.length || !member?.ohHelpWith?.length;
  const showIncomplete = !editView && isOwner && (showWarningUseCaseA || showWarningUseCaseB);
  const { data: officeHoursValidationOnLoad } = useValidateOfficeHoursQuery(member?.id, isLoggedIn);
  const officeHoursValidation = {
    isValid: !officeHoursValidationOnLoad
      ? true
      : officeHoursValidationOnLoad?.ohStatus === 'OK' || officeHoursValidationOnLoad?.ohStatus === 'NOT_FOUND' || officeHoursValidationOnLoad?.ohStatus === null,
  };

  useMobileNavVisibility(editView);

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div
      className={clsx(s.root, {
        [s.editView]: editView,
        [s.missingData]: showIncomplete,
        [s.missingDataAlert]: officeHoursValidation && !officeHoursValidation.isValid && isOwner && !editView,
      })}
    >
      {editView ? (
        <EditOfficeHoursForm onClose={() => setEditView(false)} member={member} userInfo={userInfo} />
      ) : (
        <OfficeHoursView
          member={member}
          isLoggedIn={isLoggedIn}
          userInfo={userInfo}
          isEditable={isEditable}
          showIncomplete={showIncomplete}
          onEdit={() => setEditView(true)}
          isOfficeHoursValid={officeHoursValidation?.isValid ?? true}
        />
      )}
    </div>
  );
};
