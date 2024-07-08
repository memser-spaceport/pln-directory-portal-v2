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
import usePagination from '@/hooks/usePagination';

interface ITeamList {
  totalTeams: number;
  searchParams: ITeamsSearchParams;
  children: any;
}
const TeamsList = (props: ITeamList) => {
  const searchParams = props?.searchParams;
  const viewType = searchParams['viewType'] || VIEW_TYPE_OPTIONS.GRID;

  const totalTeams = props?.totalTeams;
  const observerTarget = useRef<HTMLDivElement>(null);
  const children = props?.children;

  const [visibleItems] = usePagination({
    items: children,
    observerTarget,
  });

  return (
    <div className="team-list">
      <div className="team-list__titlesec">
        <h1 className="team-list__titlesec__title">Teams</h1> <div className="team-list__title__count">({totalTeams})</div>
      </div>
      <div className={`${VIEW_TYPE_OPTIONS.GRID === viewType ? 'team-list__grid' : 'team-list__list'}`}>
        {visibleItems}
        <div ref={observerTarget} style={{ height: '20px' }} />
      </div>
      <style jsx>{`
        .team-list {
          width: 100%;
          margin-bottom: 16px;
        }

        .team-list__titlesec {
          display: flex;
          gap: 4px;
          align-items: baseline;
          padding: 12px 16px;
          position: sticky;
          top: 150px;
          z-index: 3;
          background: #f1f5f9;
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
        }

        .team-list__team {
          cursor: pointer;
        }

        .team-list__grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, 167.5px);
          justify-content: center;
          row-gap: 24px;
          column-gap: 16px;
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
            width: 100%;
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
            grid-template-columns: repeat(auto-fit, 289px);
          }

          .team-list__titlesec {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default TeamsList;
