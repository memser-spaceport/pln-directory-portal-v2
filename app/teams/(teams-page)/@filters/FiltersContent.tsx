'use client';

import { useQuery } from '@tanstack/react-query';
import { ITeamsSearchParams } from '@/types/teams.types';
import { IUserInfo } from '@/types/shared.types';
import Error from '../../../../components/core/error';
import FilterWrapper from '../../../../components/page/teams/filter-wrapper';
import { fetchFiltersData, fetchFocusAreas } from '../teamsApi';
import { processFilters } from '@/utils/team.utils';

interface FiltersContentProps {
  searchParams: ITeamsSearchParams;
  userInfo: IUserInfo | undefined;
}

export default function FiltersContent({ searchParams, userInfo }: FiltersContentProps) {
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

  const isLoading = isLoadingFilters || isLoadingFocusAreas;
  const isError = isFiltersError || isFocusAreasError;

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

  // Show loading skeleton or placeholder
  if (isLoading || !filterValues) {
    return (
      <div style={{ padding: '20px' }}>
        <p>Loading filters...</p>
      </div>
    );
  }

  return <FilterWrapper searchParams={searchParams} filterValues={filterValues} userInfo={userInfo!} />;
}
