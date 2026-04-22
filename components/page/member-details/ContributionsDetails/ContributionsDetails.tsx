'use client';

import React, { useState } from 'react';

import { IMember, IProjectContribution } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';

import { ContributionsList } from '@/components/page/member-details/ContributionsDetails/components/ContributionsList';
import { EditContributionsForm } from '@/components/page/member-details/ContributionsDetails/components/EditContributionsForm';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { getAccessLevel } from '@/utils/auth.utils';
import { USE_ACCESS_CONTROL_V2 } from '@/utils/feature-flags';
import { useMemberContactsAccess } from '@/services/access-control/hooks/useMemberContactsAccess';
import { useMobileNavVisibility } from '@/hooks/useMobileNavVisibility';
import { DetailsSection } from '@/components/common/profile/DetailsSection';
import { isAdminUser } from '@/utils/user/isAdminUser';
import { ViewType } from '@/types/ui';

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
}

export const ContributionsDetails = ({ isLoggedIn, userInfo, member }: Props) => {
  const [view, setView] = useState<ViewType>('view');
  const [selectedItem, setSelectedItem] = useState<null | IProjectContribution>(null);
  const isAdmin = isAdminUser(userInfo)
  const isOwner = userInfo?.uid === member.id;
  const { hasAccess: v2HasMemberContacts } = useMemberContactsAccess();
  const isEditable = isOwner || isAdmin;
  const { onEditContributionDetailsClicked, onAddContributionDetailsClicked } = useMemberAnalytics();
  useMobileNavVisibility(view !== 'view');

  if (!isLoggedIn || ((USE_ACCESS_CONTROL_V2 ? !v2HasMemberContacts : getAccessLevel(userInfo, isLoggedIn) !== 'advanced') && !isOwner)) {
    return null;
  }

  return (
    <DetailsSection editView={view !== 'view'}>
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
    </DetailsSection>
  );
};
