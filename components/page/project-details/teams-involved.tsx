'use client';

import { Fragment, useRef, useState } from 'react';
import AllTeamsModal from './all-teams-modal';
import { IAnalyticsUserInfo } from '@/types/shared.types';
import { EVENTS } from '@/utils/constants';
import { useProjectAnalytics } from '@/analytics/project.analytics';
import { getAnalyticsTeamInfo, getAnalyticsUserInfo } from '@/utils/common.utils';

interface ITeamsInvolved {
  project: any;
  user: IAnalyticsUserInfo;
}

const TeamsInvolved = (props: ITeamsInvolved) => {
  const project = props?.project;
  const contributingTeams = project?.contributingTeams ?? [];
  const maintainingTeam = project?.maintainingTeam;
  const user = props?.user;

  const analytics = useProjectAnalytics();

  const onContributingTeamClick = (cteam: any) => {
    analytics.onProjectDetailContributingTeamClicked(getAnalyticsUserInfo(user), project?.id, getAnalyticsTeamInfo(cteam))
    window.open('/teams/' + cteam.uid);
  };

  const onMaintainerTeamClick = (team: any) => {
    analytics.onProjectDetailMaintainerTeamClicked(getAnalyticsUserInfo(user), project?.id, getAnalyticsTeamInfo(team));
    window.open('/teams/' + team?.uid);
  };

  const onCloseTeamsModal = () => {
    document.dispatchEvent(new CustomEvent(EVENTS.PROJECT_DETAIL_ALL_TEAMS_OPAN_AND_CLOSE, { detail: false }));
  };

  const onOpenTeamsModal = () => {
    analytics.onProjectDetailSeeAllTeamsClicked(getAnalyticsUserInfo(user), project?.id)
    document.dispatchEvent(new CustomEvent(EVENTS.PROJECT_DETAIL_ALL_TEAMS_OPAN_AND_CLOSE, { detail: true }));
  };

  return (
    <>
      <div className="teams">
        <button className="teams__hdr" onClick={onOpenTeamsModal}>
          <h6 className="teams__hdr__title">Teams</h6>
          <span className="teams__hdr__count">{contributingTeams?.length + 1}</span>
        </button>
        <button className="teams__mTeam" onClick={() => onMaintainerTeamClick(maintainingTeam)}>
          <div className="teams__mTeam__info">
            <img height={40} width={40} className="teams__mTeam__info__logo" src={maintainingTeam?.logo || '/icons/team-default-profile.svg'} alt="team image" />
            <div title="Maintainer" className="teams__mTeam__info__name">
              {maintainingTeam?.name}
            </div>
          </div>
          <div className="teams__mTeam__settings">
            <img width={20} height={20} src="/icons/configuration.svg" alt="image" />
          </div>
        </button>
        {contributingTeams.length > 0 &&
          contributingTeams.map((cteam: any, index: number) => (
            <Fragment key={`cteam-${index}`}>
              {index < 3 && (
                <button className="cteam" onClick={() => onContributingTeamClick(cteam)}>
                  <div className="cteam__info">
                    <img height={40} width={40} className="cteam__info__logo" src={cteam?.logo?.url || '/icons/team-default-profile.svg'} alt="team image" />
                    <div className="cteam__info__name">{cteam?.name}</div>
                  </div>
                </button>
              )}
            </Fragment>
          ))}
        {contributingTeams.length > 3 && (
          <button className="teams__remaining" onClick={onOpenTeamsModal}>
            +{project?.contributingTeams.length - 3} more
          </button>
        )}
        <AllTeamsModal onClose={onCloseTeamsModal} project={project} onContributingTeamClicked={onContributingTeamClick} onMaintainerTeamClicked={onMaintainerTeamClick} />
      </div>
      <style jsx>{`
        button {
          background: none;
          border: none;
          outline: none;
        }

        .teams {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .teams__hdr {
          display: flex;
          width: 100%;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 14px;
          border-bottom: 1px solid #e2e8f0;
          cursor: pointer;
          color: #0f172a;
        }

        .teams__hdr:hover {
          color: #156ff7;
        }

        .teams__hdr__title {
          font-size: 18px;
          font-weight: 600;
          line-height: 28px;
          letter-spacing: 0.01em;
        }

        .teams__hdr__count {
          height: 18px;
          padding: 2px 8px 2px 8px;
          border-radius: 24px;
          background-color: #dbeafe;
          color: #156ff7;
          font-size: 12px;
          font-weight: 500;
          line-height: 14px;
          letter-spacing: 0em;
        }

        .teams__mTeam {
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
        }

        .teams__mTeam:hover {
          background-color: #f1f5f9;
        }

        .teams__mTeam__info {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .cteam:hover {
          background-color: #f1f5f9;
        }

        .cteam__info {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .teams__mTeam__info__logo {
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          background-color: #e2e8f0;
        }

        .teams__mTeam__info__name {
          max-width: 168px;
          color: #64748b;
          font-size: 14px;
          font-weight: 400;
          //   line-height: 32px;
          letter-spacing: 0em;
        }

        .cteam {
          cursor: pointer;
        }

        .cteam__info__logo {
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          background-color: #e2e8f0;
        }

        .cteam__info__name {
          max-width: 188px;
          color: #64748b;
          font-size: 14px;
          font-weight: 400;
          //   line-height: 32px;
          letter-spacing: 0em;
        }

        .teams__remaining {
          background-color: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 400;
          line-height: 32px;
          letter-spacing: 0em;
          color: #475569;
          border-radius: 4px;
        }

        .teams__remaining:hover {
          color: #fff;
          background-color: #156ff7;
        }
      `}</style>
    </>
  );
};

export default TeamsInvolved;