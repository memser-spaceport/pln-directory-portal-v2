'use client';

import React, { useState } from 'react';

import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';

import { FormattedMemberExperience } from '@/services/members/hooks/useMemberExperience';
import { EditExperienceForm } from '@/components/page/member-details/ExperienceDetails/components/EditExperienceForm';

import { getAccessLevel } from '@/utils/auth.utils';
import { USE_ACCESS_CONTROL_V2 } from '@/utils/feature-flags';
import { useMemberContactsAccess } from '@/services/access-control/hooks/useMemberContactsAccess';
import { useMobileNavVisibility } from '@/hooks/useMobileNavVisibility';
import { DetailsSection } from '@/components/common/profile/DetailsSection';

import { ExperienceDetailsView } from './components/ExperienceDetailsView';

import { ViewType } from '@/types/ui';

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
}

export const ExperienceDetails = ({ isLoggedIn, userInfo, member }: Props) => {
  const [view, setView] = useState<ViewType>('view');
  const [selectedItem, setSelectedItem] = useState<null | FormattedMemberExperience>(null);

  const isOwner = userInfo?.uid === member.id;
  const { hasAccess: v2HasMemberContacts } = useMemberContactsAccess();

  useMobileNavVisibility(view !== 'view');

  if (
    !isLoggedIn ||
    ((USE_ACCESS_CONTROL_V2 ? !v2HasMemberContacts : getAccessLevel(userInfo, isLoggedIn) !== 'advanced') && !isOwner)
  ) {
    return null;
  }

  return (
    <DetailsSection editView={view !== 'view'}>
      {view === 'view' && (
        <ExperienceDetailsView
          member={member}
          setView={setView}
          userInfo={userInfo}
          setSelectedItem={setSelectedItem}
        />
      )}
      {view === 'edit' && (
        <EditExperienceForm onClose={() => setView('view')} member={member} initialData={selectedItem} />
      )}
      {view === 'add' && <EditExperienceForm onClose={() => setView('view')} member={member} />}
    </DetailsSection>
  );
};
