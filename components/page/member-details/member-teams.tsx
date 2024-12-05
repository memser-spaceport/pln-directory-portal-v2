'use client';
import { PAGE_ROUTES } from '@/utils/constants';
import { Fragment, useRef, useState } from 'react';
import MemberDetailsTeamCard from './member-details-team-card';
import Modal from '@/components/core/modal';
import AllTeams from './all-teams';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { ITeam } from '@/types/teams.types';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { getAnalyticsMemberInfo, getAnalyticsUserInfo } from '@/utils/common.utils';

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
          {teams?.length > 3 && (
            <button className="member-teams__header__seeall-btn" onClick={onSeeAllClickHandler}>
              See all
            </button>
          )}
        </div>

        {itemsToShow.length > 0 ? (
          <div className="member-teams__teams-container">
            {itemsToShow?.map((team: any, index: number) => {
              const teamDetails = teams.find((memberTeam) => memberTeam.id === team.id);
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

          .member-teams__teams-container {
            border-radius: 12px;
            box-shadow: 0px 4px 4px 0px #0f172a0a, 0px 0px 1px 0px #0f172a1f;
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
