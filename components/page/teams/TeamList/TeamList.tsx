'use client';

import Link from 'next/link';
import { ITeam, ITeamFilterSelectedItems, ITeamsSearchParams } from '@/types/teams.types';
import { IUserInfo } from '@/types/shared.types';
import { PAGE_ROUTES, VIEW_TYPE_OPTIONS } from '@/utils/constants';
import { getAnalyticsTeamInfo, getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';
import { useTeamAnalytics } from '@/analytics/teams.analytics';
import { CardsLoader } from '@/components/core/loaders/CardsLoader';
import InfiniteScroll from 'react-infinite-scroll-component';

import { TeamAddCard } from './components/TeamAddCard';
import { TeamGridView } from './components/TeamGridView';
import { TeamsMobileFilters } from './components/TeamsMobileFilters';
import { TeamsScopeTabs } from '@/components/page/teams/TeamsScopeTabs';

import s from './TeamList.module.scss';

interface TeamListProps {
  teams: ITeam[];
  totalTeams: number;
  followingTotal?: number;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
  searchParams: ITeamsSearchParams;
  userInfo?: IUserInfo;
  filterValues?: ITeamFilterSelectedItems;
  isLoggedIn?: boolean;
}

export function TeamList(props: TeamListProps) {
  const {
    teams: data,
    totalTeams,
    followingTotal,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    searchParams,
    userInfo,
    filterValues,
    isLoggedIn,
  } = props;

  const analytics = useTeamAnalytics();
  const isFollowingOnly = searchParams.followingOnly === 'true';

  const onTeamClickHandler = (e: React.MouseEvent, team: ITeam) => {
    if (!e.ctrlKey) {
      triggerLoader(true);
    }
    analytics.onTeamCardClicked(getAnalyticsTeamInfo(team), getAnalyticsUserInfo(userInfo));
  };

  return (
    <div className={s.root}>
      <div className={s.titleSec}>
        <h1 className={s.title}>Teams</h1>
        <div className={s.count}>({totalTeams})</div>
        {isLoggedIn && (
          <div className={s.scopeTabs}>
            <TeamsScopeTabs searchParams={searchParams} followingTotal={followingTotal} />
          </div>
        )}
      </div>
      <TeamsMobileFilters userInfo={userInfo} searchParams={searchParams} filterValues={filterValues} />
      <InfiniteScroll
        scrollableTarget="body"
        loader={null}
        hasMore={hasNextPage}
        dataLength={data.length}
        next={fetchNextPage}
        style={{ overflow: 'unset' }}
      >
        <div className={s.grid}>
          {!isFollowingOnly && userInfo && userInfo?.rbac?.status === 'APPROVED' && data?.length > 0 && (
            <TeamAddCard userInfo={userInfo} viewType={VIEW_TYPE_OPTIONS.GRID} />
          )}
          {data.map((team: ITeam) => (
            <div key={team.id} className={s.team} onClick={(e) => onTeamClickHandler(e, team)}>
              <Link
                prefetch={false}
                href={`${PAGE_ROUTES.TEAMS}/${team?.id}`}
                onClick={(e) => {
                  if (e.defaultPrevented) return;
                }}
              >
                <TeamGridView userInfo={userInfo} team={team} viewType={VIEW_TYPE_OPTIONS.GRID} />
              {/* isLoggedIn/searchParams-driven follow button lands here in Phase 4 */}
              </Link>
            </div>
          ))}
          {isFetchingNextPage && <CardsLoader />}
        </div>
      </InfiniteScroll>
    </div>
  );
}
