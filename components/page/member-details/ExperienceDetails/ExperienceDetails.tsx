'use client';

import React, { useState } from 'react';

import { clsx } from 'clsx';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { EditProfileForm } from '@/components/page/member-details/ProfileDetails/components/EditProfileForm';
import { ADMIN_ROLE } from '@/utils/constants';

import { ExperiencesList } from '@/components/page/member-details/ExperienceDetails/components/ExperiencesList';

import s from './ExperienceDetails.module.scss';
import { FormattedMemberExperience } from '@/services/members/hooks/useMemberExperience';
import { EditExperienceForm } from '@/components/page/member-details/ExperienceDetails/components/EditExperienceForm';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { getAccessLevel } from '@/utils/auth.utils';

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
}

export const ExperienceDetails = ({ isLoggedIn, userInfo, member }: Props) => {
  const [view, setView] = useState<'view' | 'add' | 'edit'>('view');
  const [selectedItem, setSelectedItem] = useState<null | FormattedMemberExperience>(null);
  const isAdmin = !!(userInfo?.roles && userInfo?.roles?.length > 0 && userInfo?.roles.includes(ADMIN_ROLE));
  const isOwner = userInfo?.uid === member.id;
  const isEditable = isOwner || isAdmin;
  const { onAddExperienceDetailsClicked, onEditExperienceDetailsClicked } = useMemberAnalytics();

  if (!isLoggedIn || getAccessLevel(userInfo, isLoggedIn) !== 'advanced') {
    return null;
  }

  return (
    <div
      className={clsx(s.root, {
        [s.editView]: view !== 'view',
      })}
    >
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
      {view === 'edit' && <EditExperienceForm onClose={() => setView('view')} member={member} userInfo={userInfo} initialData={selectedItem} />}
      {view === 'add' && <EditExperienceForm onClose={() => setView('view')} member={member} userInfo={userInfo} />}
    </div>
  );
};
