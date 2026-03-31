import React from 'react';

import { DetailsSectionHeader } from '@/components/common/profile/DetailsSection';
import { AddButton } from '@/components/page/member-details/components/AddButton';
import { FormattedMemberExperience, useMemberExperience } from '@/services/members/hooks/useMemberExperience';
import { IMember } from '@/types/members.types';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { IUserInfo } from '@/types/shared.types';
import { ViewType } from '@/types/ui';

import { ExperiencesList } from './components/ExperiencesList';
import { canEditMemberProfile } from '../../../utils/canEditMemberProfile';

interface Props {
  member: IMember;
  userInfo: IUserInfo;
  setView: (view: ViewType) => void;
  setSelectedItem: (item: FormattedMemberExperience | null) => void;
}

export function ExperienceDetailsView(props: Props) {
  const { member, userInfo, setView, setSelectedItem } = props;

  const isEditable = canEditMemberProfile(userInfo, member);

  const { data, isLoading } = useMemberExperience(member.id);
  const { onAddExperienceDetailsClicked, onEditExperienceDetailsClicked } = useMemberAnalytics();

  return (
    <>
      <DetailsSectionHeader title={`Experience ${data?.length ? `(${data.length})` : ''}`}>
        {isEditable && (
          <AddButton
            onClick={() => {
              onAddExperienceDetailsClicked();
              setView('add');
            }}
          />
        )}
      </DetailsSectionHeader>
      <ExperiencesList
        data={data}
        member={member}
        userInfo={userInfo}
        isEditable={isEditable}
        isLoading={isLoading}
        onEdit={(item) => {
          onEditExperienceDetailsClicked();
          setSelectedItem(item);
          setView('edit');
        }}
      />
    </>
  );
}
