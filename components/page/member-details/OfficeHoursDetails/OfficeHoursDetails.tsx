'use client';

import React, { useEffect, useRef, useState } from 'react';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { EditOfficeHoursForm } from '@/components/page/member-details/OfficeHoursDetails/components/EditOfficeHoursForm';
import { OfficeHoursView } from '@/components/page/member-details/OfficeHoursDetails/components/OfficeHoursView';
import { useMobileNavVisibility } from '@/hooks/useMobileNavVisibility';

import s from './OfficeHoursDetails.module.scss';
import { useValidateOfficeHoursQuery } from '@/services/members/hooks/useValidateOfficeHoursQuery';
import {
  useBrokenOfficeHoursLinkBookAttemptEventCapture,
  useFixBrokenOfficeHoursLinkEventCapture,
} from '@/components/page/member-details/hooks';
import { usePathname, useRouter } from 'next/navigation';
import { DetailsSection } from '@/components/common/profile/DetailsSection';
import { isAdminUser } from '@/utils/user/isAdminUser';
import { getAccessLevel } from '@/utils/auth.utils';
import { USE_ACCESS_CONTROL_V2 } from '@/utils/feature-flags';
import { useOfficeHoursAccess } from '@/services/access-control/hooks/useOfficeHoursAccess';

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
}

export const OfficeHoursDetails = ({ isLoggedIn, userInfo, member }: Props) => {
  const forcedEditModeRef = useRef(false);
  const router = useRouter();
  const pathname = usePathname();
  const [editView, setEditView] = useState(false);
  const isAdmin = isAdminUser(userInfo);
  const isOwner = userInfo?.uid === member.id;
  const accessLevel = getAccessLevel(userInfo, isLoggedIn);
  const { canViewSupply, canSupply, canViewDemand } = useOfficeHoursAccess();
  const v2CanView = isOwner ? canViewSupply : canViewDemand;
  const isEditable = (isOwner && canSupply) || isAdmin;
  const showWarningUseCaseA = !member?.officeHours;
  const showWarningUseCaseB = !member?.ohInterest?.length || !member?.ohHelpWith?.length;
  const showIncomplete = !editView && isOwner && (showWarningUseCaseA || showWarningUseCaseB);
  const { data: officeHoursValidationOnLoad } = useValidateOfficeHoursQuery(member?.id, isLoggedIn);
  const officeHoursValidation = {
    isValid: !officeHoursValidationOnLoad
      ? member.ohStatus === 'OK' || member?.ohStatus === 'NOT_FOUND' || member?.ohStatus === null
      : officeHoursValidationOnLoad?.ohStatus === 'OK' ||
        officeHoursValidationOnLoad?.ohStatus === 'NOT_FOUND' ||
        officeHoursValidationOnLoad?.ohStatus === null,
  };

  useMobileNavVisibility(editView);

  useFixBrokenOfficeHoursLinkEventCapture();
  const { forceEditMode } = useBrokenOfficeHoursLinkBookAttemptEventCapture();

  useEffect(() => {
    if (forceEditMode && !editView && !forcedEditModeRef.current) {
      forcedEditModeRef.current = true;
      setEditView(true);
    }
  }, [editView, forceEditMode, officeHoursValidationOnLoad]);

  if (!isLoggedIn) {
    return null;
  }

  if (!isEditable && !member?.officeHours) {
    return null;
  }

  if (USE_ACCESS_CONTROL_V2 ? !v2CanView : accessLevel === 'base') {
    return null;
  }

  if (!isAdmin && !USE_ACCESS_CONTROL_V2 && (member.accessLevel === 'L0' || member.accessLevel === 'L1')) {
    return null;
  }

  return (
    <DetailsSection
      editView={editView}
      missingData={showIncomplete}
      missingDataAlert={officeHoursValidation && !officeHoursValidation.isValid && isOwner && !editView}
      classes={{ root: s.root }}
    >
      {editView ? (
        <EditOfficeHoursForm
          onClose={() => {
            setEditView(false);
            if (forceEditMode) {
              router.replace(pathname, { scroll: false });
            }
          }}
          member={member}
          userInfo={userInfo}
        />
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
    </DetailsSection>
  );
};
