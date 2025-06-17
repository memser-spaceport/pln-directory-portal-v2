'use client';

import { ITeam, ITeamsSearchParams } from '@/types/teams.types';
import { PAGE_ROUTES, VIEW_TYPE_OPTIONS } from '@/utils/constants';
import { getAnalyticsTeamInfo, getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';
import TeamGridView from './team-grid-view';
import Link from 'next/link';
import { useTeamAnalytics } from '@/analytics/teams.analytics';
import TeamListView from './team-list-view';
import TeamAddCard from './team-add-card';
import { CardsLoader } from '@/components/core/loaders/CardsLoader';
import { ListLoader } from '@/components/core/loaders/ListLoader';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useInfiniteTeamsList } from '@/services/teams/hooks/useInfiniteTeamsList';

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

  const onTeamClickHandler = (e: any, team: ITeam) => {
    if (!e.ctrlKey) {
      triggerLoader(true);
    }
    analytics.onTeamCardClicked(getAnalyticsTeamInfo(team), getAnalyticsUserInfo(userInfo));
  };

  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteTeamsList(
    {
      searchParams,
    },
    {
      initialData: { items: allTeams, total: totalTeams },
    },
  );

  const Loader = VIEW_TYPE_OPTIONS.GRID === viewType ? CardsLoader : ListLoader;

  return (
    <div className="team-list">
      <div className="team-list__titlesec">
        <h1 className="team-list__titlesec__title">Teams</h1> <div className="team-list__title__count">({totalTeams})</div>
      </div>
      <InfiniteScroll scrollableTarget="body" loader={null} hasMore={hasNextPage} dataLength={data.length} next={fetchNextPage} style={{ overflow: 'unset' }}>
        <div className={`${VIEW_TYPE_OPTIONS.GRID === viewType ? 'team-list__grid' : 'team-list__list'}`}>
          {userInfo && data?.length > 0 && <TeamAddCard userInfo={userInfo} viewType={viewType} />}
          {data?.map((team: ITeam, index: number) => (
            <div
              key={`teamitem-${team.id}-${index}`}
              className={`team-list__team ${VIEW_TYPE_OPTIONS.GRID === viewType ? 'team-list__grid__team' : 'team-list__list__team'}`}
              onClick={(e) => onTeamClickHandler(e, team)}
            >
              <Link
                prefetch={false}
                href={`${PAGE_ROUTES.TEAMS}/${team?.id}`}
                onClick={(e: any) => {
                  if (e.defaultPrevented) return;
                }}
              >
                {VIEW_TYPE_OPTIONS.GRID === viewType && <TeamGridView team={team} viewType={viewType} />}
                {VIEW_TYPE_OPTIONS.LIST === viewType && <TeamListView team={team} viewType={viewType} />}
              </Link>
            </div>
          ))}
          {isFetchingNextPage && <Loader />}
        </div>
      </InfiniteScroll>
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
          //position: sticky;
          //top: 150px;
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
