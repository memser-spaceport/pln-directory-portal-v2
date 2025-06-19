'use client';

import React, { useState } from 'react';

import { clsx } from 'clsx';
import { IMember, IProjectContribution } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { ADMIN_ROLE } from '@/utils/constants';
import { EditExperienceForm } from '@/components/page/member-details/ExperienceDetails/components/EditExperienceForm';

import s from './ContributionsDetails.module.scss';
import { ContributionsList } from '@/components/page/member-details/ContributionsDetails/components/ContributionsList';
import { EditContributionsForm } from '@/components/page/member-details/ContributionsDetails/components/EditContributionsForm';
import { useMemberAnalytics } from '@/analytics/members.analytics';

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
}

export const ContributionsDetails = ({ isLoggedIn, userInfo, member }: Props) => {
  const [view, setView] = useState<'view' | 'add' | 'edit'>('view');
  const [selectedItem, setSelectedItem] = useState<null | IProjectContribution>(null);
  const isAdmin = !!(userInfo?.roles && userInfo?.roles?.length > 0 && userInfo?.roles.includes(ADMIN_ROLE));
  const isOwner = userInfo?.uid === member.id;
  const isEditable = isOwner || isAdmin;
  const { onEditContributionDetailsClicked, onAddContributionDetailsClicked } = useMemberAnalytics();

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div
      className={clsx(s.root, {
        [s.editView]: view !== 'view',
      })}
    >
      {view === 'view' && (
        <ContributionsList
          member={member}
          userInfo={userInfo}
          isEditable={isEditable}
          onAdd={() => {
            onAddContributionDetailsClicked();
            setView('add');
          }}
          onEdit={(item) => {
            onEditContributionDetailsClicked();
            setSelectedItem(item);
            setView('edit');
          }}
        />
      )}
      {view === 'edit' && <EditContributionsForm onClose={() => setView('view')} member={member} userInfo={userInfo} initialData={selectedItem} />}
      {view === 'add' && <EditContributionsForm onClose={() => setView('view')} member={member} userInfo={userInfo} />}
    </div>
  );
};
