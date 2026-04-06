'use client';

import isEmpty from 'lodash/isEmpty';
import { useRef } from 'react';

import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { ITeam } from '@/types/teams.types';

import { getAnalyticsUserInfo, getAnalyticsTeamInfo, getAnalyticsMemberInfo } from '@/utils/common.utils';

import { useTeamAnalytics } from '@/analytics/teams.analytics';

import Image from 'next/image';

import Modal from '@/components/core/modal';
import {
  NoDataBlock,
  HeaderActionBtn,
  DetailsSectionHeader,
  DetailsSectionGreyContentContainer,
} from '@/components/common/profile/DetailsSection';

import { isTeamLeaderOrAdmin } from '@/components/page/team-details/utils/isTeamLeaderOrAdmin';

import { AllMembers } from './components/AllMembers';
import { TeamMembersViewCard } from './components/TeamMembersViewCard';

import s from './TeamMembersView.module.scss';

interface Props {
  members: IMember[];
  team: ITeam | undefined;
  userInfo: IUserInfo | undefined;
  toggleIsEditMode: () => void;
  onEditMember: (member: IMember) => void;
}

const MEMBERS_TO_SHOW = 3;

export function TeamMembersView(props: Props) {
  const { team, userInfo, members, toggleIsEditMode, onEditMember } = props;

  const teamId = team?.id;

  const analytics = useTeamAnalytics();
  const allMembersRef = useRef<HTMLDialogElement>(null);

  const hasEditAccess = isTeamLeaderOrAdmin(userInfo, team?.id);

  const onSeeAllClickHandler = () => {
    allMembersRef?.current?.showModal();
    analytics.onTeamDetailSeeAllMemberClicked(getAnalyticsTeamInfo(team), getAnalyticsUserInfo(userInfo));
  };

  const onMemberClickHandler = (member: IMember) => {
    analytics.onTeamDetailMemberClicked(
      getAnalyticsTeamInfo(team),
      getAnalyticsUserInfo(userInfo),
      getAnalyticsMemberInfo(member),
    );
  };

  const onCloseModal = () => {
    allMembersRef?.current?.close();
  };

  const membersCount = members?.length || 0;
  const noMembers = isEmpty(members);

  return (
    <>
      <DetailsSectionHeader title={noMembers ? 'Members' : `Members (${membersCount})`}>
        {hasEditAccess && (
          <HeaderActionBtn onClick={toggleIsEditMode}>
            <Image loading="lazy" alt="add" src="/icons/add-blue.svg" height={16} width={16} />
            Add New
          </HeaderActionBtn>
        )}
      </DetailsSectionHeader>

      {noMembers ? (
        <DetailsSectionGreyContentContainer>
          <NoDataBlock>Add members associated with this team.</NoDataBlock>
        </DetailsSectionGreyContentContainer>
      ) : (
        <div className={s.membersList}>
          {members.slice(0, MEMBERS_TO_SHOW).map((member, index) => (
            <TeamMembersViewCard
              key={member.id ?? index}
              member={member}
              teamId={teamId}
              showBorder={index < MEMBERS_TO_SHOW - 1}
              hasEditAccess={hasEditAccess}
              onClick={onMemberClickHandler}
              onEdit={onEditMember}
            />
          ))}
        </div>
      )}

      {membersCount > MEMBERS_TO_SHOW && (
        <div className={s.showAll} onClick={onSeeAllClickHandler}>
          Show All Members
        </div>
      )}

      <Modal modalRef={allMembersRef} onClose={onCloseModal}>
        <AllMembers
          members={members}
          teamId={teamId || ''}
          hasEditAccess={hasEditAccess}
          onCardClick={onMemberClickHandler}
          onEditMember={(member: IMember) => {
            onEditMember(member);

            if (allMembersRef?.current) {
              allMembersRef?.current?.close();
            }
          }}
        />
      </Modal>
    </>
  );
}
