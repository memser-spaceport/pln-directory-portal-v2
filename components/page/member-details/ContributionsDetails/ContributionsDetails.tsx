'use client';

import React, { useState } from 'react';

import { IMember, IProjectContribution } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { ADMIN_ROLE } from '@/utils/constants';

import { ContributionsList } from '@/components/page/member-details/ContributionsDetails/components/ContributionsList';
import { EditContributionsForm } from '@/components/page/member-details/ContributionsDetails/components/EditContributionsForm';
import { MemberDetailsSection } from '@/components/page/member-details/MemberDetailsSection';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { getAccessLevel } from '@/utils/auth.utils';
import { useMobileNavVisibility } from '@/hooks/useMobileNavVisibility';

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
  useMobileNavVisibility(view !== 'view');

  if (!isLoggedIn || (getAccessLevel(userInfo, isLoggedIn) !== 'advanced' && !isOwner)) {
    return null;
  }

  return (
    <MemberDetailsSection editView={view !== 'view'}>
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
      {view === 'edit' && (
        <EditContributionsForm onClose={() => setView('view')} member={member} initialData={selectedItem} />
      )}
      {view === 'add' && <EditContributionsForm onClose={() => setView('view')} member={member} />}
    </MemberDetailsSection>
  );
};
