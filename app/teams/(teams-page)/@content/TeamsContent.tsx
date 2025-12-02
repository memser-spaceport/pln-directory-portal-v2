'use client';

import { useQuery } from '@tanstack/react-query';
import { ITeamsSearchParams } from '@/types/teams.types';
import { IUserInfo } from '@/types/shared.types';
import EmptyResult from '../../../../components/core/empty-result';
import Error from '../../../../components/core/error';
import TeamsToolbar from '../../../../components/page/teams/teams-toolbar';
import TeamList from '@/components/page/teams/team-list';
import styles from './page.module.css';
import { fetchTeamsList } from '../teamsApi';
import { useEffect } from 'react';
import { triggerLoader } from '@/utils/common.utils';
import { ContentPanelSkeletonLoader } from '@/components/core/dashboard-pages-layout/ContentPanelSkeletonLoader';
import { useTeamsFilters } from '../hooks/useGetTeamsFilterValues';

interface TeamsContentProps {
  searchParams: ITeamsSearchParams;
  userInfo: IUserInfo | undefined;
}

export default function TeamsContent({ searchParams, userInfo }: TeamsContentProps) {
  // Use the shared hook for filters
  const { filterValues, isLoading: isLoadingFilters, isError: isFiltersError } = useTeamsFilters(searchParams);

  // Fetch teams list
  const {
    data: teamsData,
    isLoading: isLoadingTeams,
    isError: isTeamsError,
  } = useQuery({
    queryKey: ['teams', 'list', searchParams],
    queryFn: () => fetchTeamsList(searchParams),
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 60000, // Keep in cache for 60 seconds
  });

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

  const teams = teamsData?.teams || [];
  const totalTeams = teamsData?.totalItems || 0;

  return (
    <div className={styles.team__right__content}>
      <div className={styles.team__right__toolbar}>
        <TeamsToolbar totalTeams={totalTeams} searchParams={searchParams} userInfo={userInfo} />
      </div>
      <div className={styles.team__right__teamslist}>
        {teams.length > 0 ? (
          <TeamList
            teams={teams}
            totalTeams={totalTeams}
            searchParams={searchParams}
            userInfo={userInfo}
            filterValues={filterValues}
          />
        ) : (
          <EmptyResult />
        )}
      </div>
    </div>
  );
}
