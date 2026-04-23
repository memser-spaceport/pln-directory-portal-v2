'use client';

import React, { useState } from 'react';

import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';

import { getAccessLevel } from '@/utils/auth.utils';
import { USE_ACCESS_CONTROL_V2 } from '@/utils/feature-flags';
import { useMemberContactsAccess } from '@/services/access-control/hooks/useMemberContactsAccess';
import { ITeam } from '@/types/teams.types';
import { TeamsList } from '@/components/page/member-details/TeamsDetails/components/TeamsList';
import { EditTeamForm } from '@/components/page/member-details/TeamsDetails/components/EditTeamForm';
import { useMobileNavVisibility } from '@/hooks/useMobileNavVisibility';
import { DetailsSection, DetailsSectionHeader } from '@/components/common/profile/DetailsSection';
import { AddButton } from '@/components/page/member-details/components/AddButton';
import { ViewType } from '@/types/ui';
import { canEditMemberProfile } from '@/components/page/member-details/utils/canEditMemberProfile';
import { isMemberProfileOwner } from '@/components/page/member-details/utils/isMemberProfileOwner';

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
}

export const TeamsDetails = ({ isLoggedIn, userInfo, member }: Props) => {
  const [view, setView] = useState<ViewType>('view');
  const [selectedItem, setSelectedItem] = useState<null | ITeam>(null);

  const isOwner = isMemberProfileOwner(userInfo, member);
  const isEditable = canEditMemberProfile(userInfo, member);
  const { hasAccess: v2HasMemberContacts } = useMemberContactsAccess();

  useMobileNavVisibility(view !== 'view');

  if (!isLoggedIn || ((USE_ACCESS_CONTROL_V2 ? !v2HasMemberContacts : getAccessLevel(userInfo, isLoggedIn) !== 'advanced') && !isOwner)) {
    return null;
  }

  return (
    <DetailsSection editView={view !== 'view'}>
      {view === 'view' && (
        <>
          <DetailsSectionHeader title={`Teams ${member.teams?.length ? `(${member.teams.length})` : ''}`}>
            {isEditable && (
              <AddButton
                onClick={() => {
                  setView('add');
                }}
              />
            )}
          </DetailsSectionHeader>
          <TeamsList
            member={member}
            userInfo={userInfo}
            isEditable={isEditable}
            onEdit={(item) => {
              setSelectedItem(item);
              setView('edit');
            }}
          />
        </>
      )}
      {view === 'edit' && <EditTeamForm onClose={() => setView('view')} member={member} initialData={selectedItem} />}
      {view === 'add' && <EditTeamForm onClose={() => setView('view')} member={member} />}
    </DetailsSection>
  );
};
