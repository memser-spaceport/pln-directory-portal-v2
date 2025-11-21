'use client';

import { useQuery } from '@tanstack/react-query';
import { ITeamsSearchParams } from '@/types/teams.types';
import { IUserInfo } from '@/types/shared.types';
import Error from '../../../../components/core/error';
import FilterWrapper from '../../../../components/page/teams/filter-wrapper';
import { fetchFiltersData, fetchFocusAreas } from '../teamsApi';
import { processFilters } from '@/utils/team.utils';
import { useMemo } from 'react';
import { FiltersPanelSkeletonLoader } from '@/components/core/dashboard-pages-layout';

interface FiltersContentProps {
  searchParams: ITeamsSearchParams;
  userInfo: IUserInfo | undefined;
}

export default function FiltersContent({ searchParams, userInfo }: FiltersContentProps) {
  // Fetch filters data (static doesn't change based on searchParams)
  const {
    data: filtersData,
    isLoading: isLoadingFilters,
    isError: isFiltersError,
  } = useQuery({
    queryKey: ['teams', 'filters'],
    queryFn: () => fetchFiltersData(),
    staleTime: Infinity, // Never refetch - filter options are static
    gcTime: Infinity, // Keep in cache forever
  });

  // Fetch focus areas (static initial load, not dependent on current filters)
  const {
    data: focusAreasData,
    isLoading: isLoadingFocusAreas,
    isError: isFocusAreasError,
  } = useQuery({
    queryKey: ['teams', 'focus-areas-initial'],
    queryFn: () => fetchFocusAreas({} as ITeamsSearchParams), // Fetch all focus areas without filters
    staleTime: Infinity, // Never refetch - focus area structure is static
    gcTime: Infinity, // Keep in cache forever
  });

  // Process filter values - memoized to avoid recalculation
  // Must be called before any conditional returns (React hooks rule)
  const filterValues = useMemo(() => {
    if (!filtersData || !focusAreasData) return null;

    const processed = processFilters(searchParams, filtersData, filtersData, focusAreasData.data);

    // Handle 'all' asks selection
    if (searchParams?.asks === 'all') {
      processed.asks.forEach((ask) => {
        if (!ask.disabled) {
          ask.selected = true;
        }
      });
    }

    return processed;
  }, [searchParams, filtersData, focusAreasData]);

  const isError = isFiltersError || isFocusAreasError;

  if (isError) {
    return <Error />;
  }

  // Only show loading on an initial load, not when searchParams change
  if (isLoadingFilters || isLoadingFocusAreas) {
    return <FiltersPanelSkeletonLoader />;
  }

  // If data is loaded but filterValues is null (shouldn't happen)
  if (!filterValues) {
    return null;
  }

  return <FilterWrapper searchParams={searchParams} filterValues={filterValues} userInfo={userInfo!} />;
}
