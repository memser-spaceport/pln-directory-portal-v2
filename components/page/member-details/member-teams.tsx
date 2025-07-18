'use client';
import { PAGE_ROUTES } from '@/utils/constants';
import React, { Fragment, useRef, useState } from 'react';
import MemberDetailsTeamCard from './member-details-team-card';
import Modal from '@/components/core/modal';
import AllTeams from './all-teams';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { ITeam } from '@/types/teams.types';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { getAnalyticsMemberInfo, getAnalyticsUserInfo } from '@/utils/common.utils';
import { getAccessLevel } from '@/utils/auth.utils';
import { useRouter } from 'next/navigation';

interface IMemberTeams {
  member: IMember;
  userInfo: IUserInfo;
  isLoggedIn: boolean;
  teams: ITeam[];
}

const MemberTeams = (props: IMemberTeams) => {
  const member = props?.member;
  const teams = props?.teams ?? [];
  const totalTeams = teams?.length;
  const isLoggedIn = props?.isLoggedIn;

  const userInfo = props?.userInfo;
  const teamsRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  const analytics = useMemberAnalytics();

  const sortedTeams = member?.teams.sort((teamA: any, teamB: any) => {
    if (teamA.mainTeam === teamB.mainTeam) {
      return teamA?.name.localeCompare(teamB?.name);
    } else {
      return teamB?.mainTeam - teamA?.mainTeam;
    }
  });

  const itemsToShow = sortedTeams?.slice(0, 3);

  const onClose = () => {
    if (teamsRef.current) {
      document.dispatchEvent(new CustomEvent('close-member-teams-modal'));
      teamsRef.current.close();
    }
  };

  const onSeeAllClickHandler = () => {
    if (teamsRef.current) {
      teamsRef.current.showModal();
      analytics.onTeamsSeeAllClicked(getAnalyticsUserInfo(props?.userInfo), getAnalyticsMemberInfo(member));
    }
  };

  return (
    <>
      <div className="member-teams">
        <div className="member-teams__header">
          <h2 className="member-teams__title">Teams ({totalTeams})</h2>
          <div className="member-teams__controls">
            {teams?.length > 3 && (
              <button className="member-teams__header__seeall-btn" onClick={onSeeAllClickHandler}>
                See all
              </button>
            )}
            {isLoggedIn && getAccessLevel(userInfo, isLoggedIn) === 'advanced' && userInfo?.uid === member?.id && (
              <button onClick={() => router.push('/settings/profile?tab=skills')} className="member-teams__controls_add">
                <AddIcon /> Add
              </button>
            )}
          </div>
        </div>

        {itemsToShow.length > 0 ? (
          <div className="member-teams__teams-container">
            {itemsToShow?.map((team: any, index: number) => {
              const teamDetails = teams.find((memberTeam) => memberTeam.id === team.id);
              console.log(team, teamDetails);
              return (
                <Fragment key={`${team}+${index}`}>
                  <div className={`memberteam ${itemsToShow.length - 1 !== index ? 'memberteam__border-set' : ''}`}>
                    <MemberDetailsTeamCard
                      member={member}
                      userInfo={userInfo}
                      url={`${PAGE_ROUTES?.TEAMS}/${team?.id}`}
                      team={teamDetails}
                      tags={teamDetails?.industryTags}
                      role={team?.role}
                      isLoggedIn={isLoggedIn}
                      isMainTeam={team.mainTeam && sortedTeams.length > 1}
                    />
                  </div>
                </Fragment>
              );
            })}
          </div>
        ) : (
          <div className="member-teams__no-teams">Team(s) are yet to be linked</div>
        )}
      </div>

      <div className="all-member-container">
        <Modal modalRef={teamsRef} onClose={onClose}>
          <AllTeams userInfo={userInfo} member={member} teams={teams} isLoggedIn={isLoggedIn} sortedTeams={sortedTeams} />
        </Modal>
      </div>

      <style jsx>
        {`
          .member-teams {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .member-teams__title {
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
            letter-spacing: 0px;
            text-align: left;
            color: #64748b;
          }

          .member-teams__controls {
            display: flex;
            align-items: center;
            gap: 24px;
          }

          .member-teams__controls_add {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #156ff7;
            text-align: center;
            font-feature-settings:
              'liga' off,
              'clig' off;

            font-size: 14px;
            font-style: normal;
            font-weight: 500;
            line-height: 20px; /* 142.857% */
          }

          .member-teams__teams-container {
            border-radius: 12px;
            box-shadow:
              0px 4px 4px 0px #0f172a0a,
              0px 0px 1px 0px #0f172a1f;
            border: 1px solid #e2e8f0;
          }

          .member-teams__no-teams {
            background-color: rgb(249 250 251);
            border-radius: 12px;
            font-size: 12px;
            padding: 12px;
            display: flex;
            gap: 8px;
            color: #000;
          }

          .memberteam {
            &:hover {
              background: linear-gradient(0deg, #f8fafc, #f8fafc), linear-gradient(0deg, #e2e8f0, #e2e8f0);
            }
          }

          .memberteam__border-set {
            border-bottom: 1px solid #e2e8f0;
          }

          .member-teams__web {
            display: none;
          }
          .member-teams__header__seeall-btn {
            color: #156ff7;
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
            border: none;
            background-color: #fff;
          }

          .member-teams__header {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          @media (min-width: 1024px) {
            .member-teams__teams-container {
              max-height: 300px;
              overflow: auto;
              border: none;
            }
          }
        `}
      </style>
    </>
  );
};

export default MemberTeams;

const AddIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'translateY(-1px)' }}>
    <path
      d="M14.3438 7.09375C14.6992 7.09375 15 7.39453 15 7.75C15 8.13281 14.6992 8.40625 14.3438 8.40625H8.65625V14.0938C8.65625 14.4766 8.35547 14.75 7.97266 14.75C7.61719 14.75 7.31641 14.4766 7.31641 14.0938V8.40625H1.62891C1.27344 8.40625 0.972656 8.13281 0.972656 7.75C0.972656 7.39453 1.27344 7.09375 1.62891 7.09375H7.31641V1.40625C7.31641 1.05078 7.61719 0.75 7.97266 0.75C8.35547 0.75 8.65625 1.05078 8.65625 1.40625V7.09375H14.3438Z"
      fill="#156FF7"
    />
  </svg>
);
