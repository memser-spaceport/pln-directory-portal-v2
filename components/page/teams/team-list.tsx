'use client';

import { ITeam, ITeamListOptions, ITeamsSearchParams } from '@/types/teams.types';
import { ITEMS_PER_PAGE, PAGE_ROUTES, TOAST_MESSAGES, VIEW_TYPE_OPTIONS } from '@/utils/constants';
import { useEffect, useRef, useState } from 'react';
import { getAnalyticsTeamInfo, getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';
import TeamGridView from './team-grid-view';
import Link from 'next/link';
import { useTeamAnalytics } from '@/analytics/teams.analytics';
import { getTeamsListOptions, getTeamsOptionsFromQuery } from '@/utils/team.utils';
import usePagination from '@/hooks/irl/use-pagination';
import TeamListView from './team-list-view';
import TableLoader from '@/components/core/table-loader';
import { getTeamList } from '@/app/actions/teams.actions';

interface ITeamList {
  totalTeams: number;
  searchParams: ITeamsSearchParams;
  children: any;
}
const TeamList = (props: any) => {
  const allTeams = props?.teams ?? [];
  const userInfo = props?.userInfo;
  const searchParams = props?.searchParams;
  const totalTeams = props?.totalTeams;

  const analytics = useTeamAnalytics();
  const viewType = searchParams['viewType'] || VIEW_TYPE_OPTIONS.GRID;
  const [teamList, setTeamList] = useState<any>({ teams: allTeams, totalTeams: totalTeams });
  const [isLoading, setIsLoading] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  const onTeamClickHandler = (e: any, team: ITeam) => {
    if (!e.ctrlKey) {
      triggerLoader(true);
    }
    analytics.onTeamCardClicked(getAnalyticsTeamInfo(team), getAnalyticsUserInfo(userInfo));
  };

  const getAllTeams = async () => {
    const toast = (await import('react-toastify')).toast;
    try {
      setIsLoading(true);
      const optionsFromQuery = getTeamsOptionsFromQuery(searchParams);
      const listOptions: ITeamListOptions = getTeamsListOptions(optionsFromQuery);
      const teamsRes = await getTeamList(listOptions, currentPage);
      if (teamsRes.isError) {
        setIsLoading(false);
        toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
        return;
      }
      setTeamList((prev: any) => ({ teams: [...prev.teams, ...teamsRes?.data], totalTeams: teamsRes?.totalItems }));
    } catch (error) {
      console.error('Error in fetching teams', error);
      toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const { currentPage, setPagination } = usePagination({
    observerTargetRef: observerTarget,
    totalItems: totalTeams,
    totalCurrentItems: teamList?.teams?.length,
  });

  useEffect(() => {
    if (currentPage !== 1) {
      const fetchData = async () => {
        await getAllTeams();
      };

      fetchData();
    }
  }, [currentPage]);

  // Sync team list
  useEffect(() => {
    setPagination({ page: 1, limit: ITEMS_PER_PAGE });
    setTeamList({ teams: allTeams, totalTeams: totalTeams });
  }, [allTeams]);

  return (
    <div className="team-list">
      <div className="team-list__titlesec">
        <h1 className="team-list__titlesec__title">Teams</h1> <div className="team-list__title__count">({totalTeams})</div>
      </div>
      <div className={`${VIEW_TYPE_OPTIONS.GRID === viewType ? 'team-list__grid' : 'team-list__list'}`}>
        {[...teamList?.teams]?.map((team: ITeam, index: number) => (
          <div
            key={`teamitem-${team.id}-${index}`}
            className={`team-list__team ${VIEW_TYPE_OPTIONS.GRID === viewType ? 'team-list__grid__team' : 'team-list__list__team'}`}
            onClick={(e) => onTeamClickHandler(e, team)}
          >
            <Link href={`${PAGE_ROUTES.TEAMS}/${team?.id}`}>
              {VIEW_TYPE_OPTIONS.GRID === viewType && <TeamGridView team={team} viewType={viewType} />}
              {VIEW_TYPE_OPTIONS.LIST === viewType && <TeamListView team={team} viewType={viewType} />}
            </Link>
          </div>
        ))}
        <div ref={observerTarget} />
      </div>
      {isLoading && <TableLoader />}
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

export default TeamList;
