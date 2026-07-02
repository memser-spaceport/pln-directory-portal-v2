'use client';

import { IUserInfo } from '@/types/shared.types';
import EmptyResult from '../../../../components/core/empty-result';
import Error from '../../../../components/core/error';
import { TeamsToolbar } from '../../../../components/page/teams/TeamsToolbar';
import { TeamList } from '@/components/page/teams/TeamList';
import styles from './page.module.css';
import { useEffect } from 'react';
import { triggerLoader } from '@/utils/common.utils';
import { ContentPanelSkeletonLoader } from '@/components/core/dashboard-pages-layout/ContentPanelSkeletonLoader';
import { useTeamsFilters } from '../hooks/useGetTeamsFilterValues';
import { useGetTeamsFilterAsObjectFromStore } from '@/hooks/teams/useGetTeamsFilterAsObjectFromStore';
import { useTeamFilterStore } from '@/services/teams';
import { useInfiniteTeamsList } from '@/services/teams/hooks/useInfiniteTeamsList';
import { useFollowingTeamsCount } from '@/services/follow/hooks/useFollowingTeamsCount';
import { FollowingEmptyState } from '@/components/page/teams/FollowingEmptyState';

interface TeamsContentProps {
  userInfo: IUserInfo | undefined;
  isLoggedIn: boolean;
}

export default function TeamsContent(props: TeamsContentProps) {
  const { userInfo, isLoggedIn } = props;

  const searchParams = useGetTeamsFilterAsObjectFromStore();
  const clearParams = useTeamFilterStore((s) => s.clearParams);
  const isFollowingOnly = searchParams.followingOnly === 'true';

  // Use the shared hook for filters
  const { filterValues, isLoading: isLoadingFilters, isError: isFiltersError } = useTeamsFilters(searchParams);

  // Single source of truth for the grid, the toolbar's total count, and pagination.
  const {
    data: teams,
    total: totalTeams,
    followingTotal,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingTeams,
    isError: isTeamsError,
  } = useInfiniteTeamsList({ searchParams });

  // Lives in its own cache entry, decoupled from the active tab, so it stays accurate
  // whether the user is following/unfollowing from the All tab or the Following tab.
  const liveFollowingTotal = useFollowingTeamsCount(followingTotal);

  const isLoading = isLoadingTeams || isLoadingFilters;
  const isError = isTeamsError || isFiltersError;

  // Manage loader visibility
  useEffect(() => {
    if (isLoading) {
      triggerLoader(true);
    } else {
      triggerLoader(false);
    }
  }, [isLoading]);

  if (isError) {
    return <Error />;
  }

  if (isLoading) {
    return <ContentPanelSkeletonLoader />;
  }

  return (
    <div className={styles.team__right__content}>
      <div className={styles.team__right__toolbar}>
        <TeamsToolbar
          totalTeams={totalTeams}
          followingTotal={liveFollowingTotal}
          userInfo={userInfo}
          isLoggedIn={isLoggedIn}
        />
      </div>
      <div className={styles.team__right__teamslist}>
        {teams.length > 0 ? (
          <TeamList
            teams={teams}
            totalTeams={totalTeams}
            followingTotal={liveFollowingTotal}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
            isFetchingNextPage={isFetchingNextPage}
            searchParams={searchParams}
            userInfo={userInfo}
            filterValues={filterValues}
            isLoggedIn={isLoggedIn}
          />
        ) : isFollowingOnly ? (
          <FollowingEmptyState />
        ) : (
          <EmptyResult onClearAll={clearParams} />
        )}
      </div>
    </div>
  );
}
