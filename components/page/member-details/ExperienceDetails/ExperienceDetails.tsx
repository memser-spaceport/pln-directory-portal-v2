'use client';

import React, { useState } from 'react';

import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';

import { ExperiencesList } from '@/components/page/member-details/ExperienceDetails/components/ExperiencesList';

import { FormattedMemberExperience } from '@/services/members/hooks/useMemberExperience';
import { EditExperienceForm } from '@/components/page/member-details/ExperienceDetails/components/EditExperienceForm';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { getAccessLevel } from '@/utils/auth.utils';
import { useMobileNavVisibility } from '@/hooks/useMobileNavVisibility';
import { DetailsSection } from '@/components/common/profile/DetailsSection';
import { isAdminUser } from '@/utils/user/isAdminUser';

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
}

export const ExperienceDetails = ({ isLoggedIn, userInfo, member }: Props) => {
  const [view, setView] = useState<'view' | 'add' | 'edit'>('view');
  const [selectedItem, setSelectedItem] = useState<null | FormattedMemberExperience>(null);
  const isAdmin = isAdminUser(userInfo);
  const isOwner = userInfo?.uid === member.id;
  const isEditable = isOwner || isAdmin;
  const { onAddExperienceDetailsClicked, onEditExperienceDetailsClicked } = useMemberAnalytics();
  useMobileNavVisibility(view !== 'view');

  if (!isLoggedIn || (getAccessLevel(userInfo, isLoggedIn) !== 'advanced' && !isOwner)) {
    return null;
  }

  return (
    <DetailsSection editView={view !== 'view'}>
      {view === 'view' && (
        <ExperiencesList
          member={member}
          userInfo={userInfo}
          isEditable={isEditable}
          onAdd={() => {
            onAddExperienceDetailsClicked();
            setView('add');
          }}
          onEdit={(item) => {
            onEditExperienceDetailsClicked();
            setSelectedItem(item);
            setView('edit');
          }}
        />
      )}
      {view === 'edit' && (
        <EditExperienceForm onClose={() => setView('view')} member={member} initialData={selectedItem} />
      )}
      {view === 'add' && <EditExperienceForm onClose={() => setView('view')} member={member} />}
    </DetailsSection>
  );
};
