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
  const hasMissingRequiredData = !member?.officeHours;
  const showIncomplete = !editView && hasMissingRequiredData && isOwner;
  useMobileNavVisibility(editView);

  return (
    <div
      className={clsx(s.root, {
        [s.editView]: editView,
        [s.missingData]: showIncomplete,
      })}
    >
      {editView ? (
        <EditOfficeHoursForm onClose={() => setEditView(false)} member={member} userInfo={userInfo} />
      ) : (
        <OfficeHoursView member={member} isLoggedIn={isLoggedIn} userInfo={userInfo} isEditable={isEditable} showIncomplete={showIncomplete} onEdit={() => setEditView(true)} />
      )}
    </div>
  );
};
