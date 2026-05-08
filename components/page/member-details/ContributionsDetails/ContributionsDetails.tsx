'use client';

import React, { useState } from 'react';

import { IMember, IProjectContribution } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';

import { ContributionsList } from '@/components/page/member-details/ContributionsDetails/components/ContributionsList';
import { EditContributionsForm } from '@/components/page/member-details/ContributionsDetails/components/EditContributionsForm';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { useMobileNavVisibility } from '@/hooks/useMobileNavVisibility';
import { DetailsSection } from '@/components/common/profile/DetailsSection';
import { isAdminUser } from '@/utils/user/isAdminUser';
import { ViewType } from '@/types/ui';
import { useCurrentUserStore } from '@/services/auth/store';

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo | null;
}

export const ContributionsDetails = ({ isLoggedIn, member }: Props) => {
  const [view, setView] = useState<ViewType>('view');
  const [selectedItem, setSelectedItem] = useState<null | IProjectContribution>(null);
  const { currentUser } = useCurrentUserStore();
  const isAdmin = isAdminUser(currentUser);
  const isOwner = currentUser?.uid === member.id;
  const isEditable = isOwner || isAdmin;
  const { onEditContributionDetailsClicked, onAddContributionDetailsClicked } = useMemberAnalytics();
  useMobileNavVisibility(view !== 'view');

  if (!isLoggedIn || (currentUser?.rbac?.status !== 'APPROVED' && !isOwner)) {
    return null;
  }

  return (
    <DetailsSection editView={view !== 'view'}>
      {view === 'view' && (
        <ContributionsList
          member={member}
          userInfo={currentUser}
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
    </DetailsSection>
  );
};
