'use client';

import { Fragment, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { ITeam } from '@/types/teams.types';

import { EVENTS, PAGE_ROUTES } from '@/utils/constants';

import {
  triggerLoader,
  getAnalyticsUserInfo,
  getAnalyticsTeamInfo,
  getAnalyticsMemberInfo,
} from '@/utils/common.utils';

import { useTeamAnalytics } from '@/analytics/teams.analytics';

import Modal from '@/components/core/modal';
import { EditButton } from '@/components/common/profile/EditButton';

import { isTeamLeaderOrAdmin } from '../utils/isTeamLeaderOrAdmin';
import { TeamMemberCard } from './components/TeamMemberCard';
import { AllMembers } from './components/AllMembers';

import s from './TeamMembers.module.scss';

interface Props {
  members: IMember[] | undefined;
  teamId: string;
  team: ITeam | undefined;
  userInfo: IUserInfo | undefined;
}

export function TeamMembers(props: Props) {
  const { teamId, team, userInfo } = props;
  const members = props.members ?? [];

  const analytics = useTeamAnalytics();
  const allMembersRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const hasEditAccess = isTeamLeaderOrAdmin(userInfo, team?.id);

  const onClose = () => {
    document.dispatchEvent(new CustomEvent(EVENTS.TEAM_DETAIL_ALL_MEMBERS_CLOSE, { detail: '' }));
    if (allMembersRef?.current) {
      allMembersRef.current.close();
    }
  };

  const onSeeAllClickHandler = () => {
    if (allMembersRef?.current) {
      allMembersRef?.current?.showModal();
    }
    analytics.onTeamDetailSeeAllMemberClicked(getAnalyticsTeamInfo(team), getAnalyticsUserInfo(userInfo));
  };

  const onMemberClickHandler = (member: IMember) => {
    analytics.onTeamDetailMemberClicked(
      getAnalyticsTeamInfo(team),
      getAnalyticsUserInfo(userInfo),
      getAnalyticsMemberInfo(member),
    );
  };

  const onEditMembersClickHandler = () => {
    if (!team?.id) return;
    triggerLoader(true);
    router.push(`${PAGE_ROUTES.SETTINGS}/teams?id=${team.id}&tab=members`);
  };

  return (
    <>
      <div className={s.root}>
        <div className={s.header}>
          <h2 className={s.title}>Members ({members?.length ? members?.length : 0})</h2>
          <div className={s.headerActions}>
            {members?.length > 3 && (
              <button className={s.seeAllButton} onClick={onSeeAllClickHandler}>
                See All
              </button>
            )}
            {hasEditAccess && <EditButton onClick={onEditMembersClickHandler} />}
          </div>
        </div>

        <div className={s.membersWeb}>
          {members?.slice(0, 3)?.map((member: IMember, index: number) => {
            const team = member?.teams?.find((team: ITeam) => team.id === teamId);
            return (
              <Fragment key={`${member} + ${index}`}>
                <div className={index < members.length - 1 ? s.memberBorder : undefined}>
                  <TeamMemberCard
                    onCardClick={onMemberClickHandler}
                    url={`${PAGE_ROUTES.MEMBERS}/${member?.id}`}
                    member={member}
                    team={team}
                  />
                </div>
              </Fragment>
            );
          })}
        </div>
        {!members?.length && <p className={s.empty}>No members added yet</p>}
      </div>

      <Modal modalRef={allMembersRef} onClose={onClose}>
        <AllMembers onCardClick={onMemberClickHandler} members={members} teamId={teamId} />
      </Modal>
    </>
  );
}
