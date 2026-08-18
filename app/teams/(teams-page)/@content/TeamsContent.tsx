'use client';

import { IUserInfo } from '@/types/shared.types';
import EmptyResult from '../../../../components/core/empty-result';
import Error from '../../../../components/core/error';
import { TeamsToolbar } from '../../../../components/page/teams/TeamsToolbar';
import { TeamList } from '@/components/page/teams/TeamList';
import styles from './page.module.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { triggerLoader } from '@/utils/common.utils';
import { useIsMobile } from '@/hooks/useIsMobile';
import { TeamNewsModal } from '@/components/page/team-details/TeamNews';
import { useTeamNewsCounts } from '@/services/team-news/hooks/useTeamNewsCounts';
import { SHOW_TEAM_NEWS_COUNT_CHIP } from '@/services/team-news/constants';
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
    isRefetching,
  } = useInfiniteTeamsList({ searchParams });

  // Lives in its own cache entry, decoupled from the active tab, so it stays accurate
  // whether the user is following/unfollowing from the All tab or the Following tab.
  // Withhold the sync while a background refetch is in flight (e.g. right after switching to a
  // tab whose cache was just invalidated) — otherwise the stale cached value gets briefly synced
  // in before the fresh one arrives, flashing the wrong count.
  const liveFollowingTotal = useFollowingTeamsCount(isRefetching ? undefined : followingTotal);

  // Counts behind the "N new posts" chips, requested once per batch of teams the
  // grid has rendered. `team.id` IS the backend teamUid here — getTeamList maps
  // `id: team.uid` and its projection carries no `uid` field at all.
  //
  // Declared above the early returns below, which is not optional: hooks can't
  // sit under a conditional return.
  const teamUids = useMemo(() => teams.map((team) => team.id).filter(Boolean), [teams]);
  useTeamNewsCounts({ uids: teamUids, enabled: SHOW_TEAM_NEWS_COUNT_CHIP });

  // Which team's news is open over the grid. Held here rather than in TeamList
  // so it survives the `teams.length > 0` swap to an empty state, and well above
  // the memoized cards.
  const [newsModal, setNewsModal] = useState<{ teamUid: string; teamName: string } | null>(null);
  // Stable identity: TeamGridView is memo()'d with a shallow compare, so an
  // inline arrow here would re-render every card on every parent render.
  const openTeamNews = useCallback((teamUid: string, teamName: string) => {
    setNewsModal({ teamUid, teamName });
  }, []);
  const closeTeamNews = useCallback(() => setNewsModal(null), []);
  const isMobile = useIsMobile();

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
            onOpenTeamNews={openTeamNews}
          />
        ) : isFollowingOnly ? (
          <FollowingEmptyState />
        ) : (
          <EmptyResult onClearAll={clearParams} />
        )}
      </div>

      {/* The chip's answer: this team's news, over the grid rather than instead
          of it. `total` is deliberately omitted — the chip counted 30 days and
          this box lists the whole archive, so it latches its own figure. */}
      {newsModal && (
        <TeamNewsModal
          isOpen
          focusUid={null}
          onClose={closeTeamNews}
          teamUid={newsModal.teamUid}
          teamName={newsModal.teamName}
          fullscreen={isMobile}
          source="teams-listing-modal"
        />
      )}
    </div>
  );
}
