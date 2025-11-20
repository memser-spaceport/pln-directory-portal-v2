'use client';

import { useQuery } from '@tanstack/react-query';
import { ITeamsSearchParams } from '@/types/teams.types';
import { IUserInfo } from '@/types/shared.types';
import EmptyResult from '../../../../components/core/empty-result';
import Error from '../../../../components/core/error';
import TeamsToolbar from '../../../../components/page/teams/teams-toolbar';
import TeamList from '@/components/page/teams/team-list';
import styles from './page.module.css';
import { fetchTeamsList, fetchFiltersData, fetchFocusAreas } from '../teamsApi';
import { processFilters } from '@/utils/team.utils';
import { useEffect } from 'react';
import { triggerLoader } from '@/utils/common.utils';

interface TeamsContentProps {
  searchParams: ITeamsSearchParams;
  userInfo: IUserInfo | undefined;
}

export default function TeamsContent({ searchParams, userInfo }: TeamsContentProps) {
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

  // Fetch filters data
  const {
    data: filtersData,
    isLoading: isLoadingFilters,
    isError: isFiltersError,
  } = useQuery({
    queryKey: ['teams', 'filters'],
    queryFn: () => fetchFiltersData(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Fetch focus areas
  const {
    data: focusAreasData,
    isLoading: isLoadingFocusAreas,
    isError: isFocusAreasError,
  } = useQuery({
    queryKey: ['teams', 'focus-areas', searchParams],
    queryFn: () => fetchFocusAreas(searchParams),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  const isLoading = isLoadingTeams || isLoadingFilters || isLoadingFocusAreas;
  const isError = isTeamsError || isFiltersError || isFocusAreasError;

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

  // Process filter values
  let filterValues;
  if (filtersData && focusAreasData) {
    filterValues = processFilters(
      searchParams,
      filtersData,
      filtersData,
      focusAreasData.data
    );

    // Handle 'all' asks selection
    if (searchParams?.asks === 'all') {
      filterValues.asks.forEach((ask) => {
        if (!ask.disabled) {
          ask.selected = true;
        }
      });
    }
  }

  const teams = teamsData?.teams || [];
  const totalTeams = teamsData?.totalItems || 0;

  return (
    <div className={styles.team__right__content}>
      <div className={styles.team__right__toolbar}>
        <TeamsToolbar totalTeams={totalTeams} searchParams={searchParams} userInfo={userInfo} />
      </div>
      <div className={styles.team__right__teamslist}>
        {isLoading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading teams...</p>
          </div>
        ) : teams.length > 0 ? (
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
