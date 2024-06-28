'use client';

import { getAllTeams } from '@/services/teams.service';
import { IUserInfo } from '@/types/shared.types';
import { ITeam, ITeamsSearchParams } from '@/types/teams.types';
import { getAnalyticsTeamInfo, getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';
import { PAGE_ROUTES, VIEW_TYPE_OPTIONS } from '@/utils/constants';
import { getTeamsListOptions, getTeamsOptionsFromQuery } from '@/utils/team.utils';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import TeamGridView from './team-grid-view';
import TeamListView from './team-list-view';
import { PaginationBox } from '../../core/pagination-box';
import Link from 'next/link';
import { useTeamAnalytics } from '@/analytics/teams.analytics';

interface ITeamList {
  teams: ITeam[];
  totalTeams: number;
  searchParams: ITeamsSearchParams;
  userInfo: IUserInfo | undefined;
}
const TeamsList = (props: ITeamList) => {
  const searchParams = props?.searchParams;
  const viewType = searchParams['viewType'] || VIEW_TYPE_OPTIONS.GRID;
  const allTeams = props?.teams ?? [];
  const userInfo = props?.userInfo;
  const totalTeams = props?.totalTeams;

  const analytics = useTeamAnalytics();
  const onTeamClickHandler = (team: ITeam) => {
    triggerLoader(true);
    analytics.onTeamCardClicked(getAnalyticsTeamInfo(team), getAnalyticsUserInfo(userInfo));
  };

  return (
    <div className="team-list">
      <div className="team-list__titlesec">
        <h1 className="team-list__titlesec__title">Teams</h1> <div className="team-list__title__count">({totalTeams})</div>
      </div>
      <div className={`${VIEW_TYPE_OPTIONS.GRID === viewType ? 'team-list__grid' : 'team-list__list'}`}>
        {allTeams?.map((team: ITeam, index: number) => (
          <div
            key={`${team} + ${index}`}
            className={`team-list__team ${VIEW_TYPE_OPTIONS.GRID === viewType ? 'team-list__grid__team' : 'team-list__list__team'}`}
            onClick={() => onTeamClickHandler(team)}
          >
            <a href={`${PAGE_ROUTES.TEAMS}/${team?.id}`}>
              {VIEW_TYPE_OPTIONS.GRID === viewType && <TeamGridView team={team} viewType={viewType} />}
              {VIEW_TYPE_OPTIONS.LIST === viewType && <TeamListView team={team} viewType={viewType} />}
            </a>
          </div>
        ))}
      </div>
      <style jsx>{`
        .team-list {
          width: 100%;
          margin-top: 24px;
          margin-bottom: 16px;
        }

        .team-list__titlesec {
          display: flex;
          gap: 4px;
          padding: 0px 38px 16px 38px;
        }

        .team-list__titlesec__title {
          font-size: 24px;
          line-height: 40px;
          font-weight: 700;
          color: #0f172a;
        }

        .team-list__title__count {
          font-size: 14px;
          font-weight: 400;
          color: #64748b;
          margin-top: 10px;
        }

        .team-list__team {
          cursor: pointer;
        }

        .team-list__grid {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          width: 100%;
          width: 300px;
          margin: auto;
        }

        .team-list__list {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 16px;
        }

        .team-list__list__team {
          width: 100%;
          padding: 0px 16px;
        }

        @media (min-width: 768px) {
          .team-list__grid {
            width: 600px;
          }
        }

        @media (min-width: 1024px) {
          .team-list__list__team {
            padding: 0px 0px;
          }

          .team-list {
            margin-top: 0px;
          }

          .team-list__grid {
            width: 900px;
          }

                    .team-list__titlesec {
            display: none;
          }
        }

        @media (min-width: 1400px) {
          .team-list__grid {
            width: unset;
            // justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default TeamsList;
