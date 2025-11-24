'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { ITeamsSearchParams } from '@/types/teams.types';
import { fetchFiltersData, fetchFocusAreas } from '../teamsApi';
import { processFilters } from '@/utils/team.utils';

export function useTeamsFilters(searchParams: ITeamsSearchParams) {
  // Fetch filters data
  const {
    data: filtersData,
    isLoading: isLoadingFilters,
    isError: isFiltersError,
  } = useQuery({
    queryKey: ['teams', 'filters'],
    queryFn: () => fetchFiltersData(),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // Fetch focus areas - using dynamic approach based on searchParams
  const {
    data: focusAreasData,
    isLoading: isLoadingFocusAreas,
    isError: isFocusAreasError,
  } = useQuery({
    queryKey: ['teams', 'focus-areas', searchParams],
    queryFn: () => fetchFocusAreas(searchParams),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Process filter values
  const filterValues = useMemo(() => {
    if (!filtersData || !focusAreasData) return null;

    const processed = processFilters(
      searchParams,
      filtersData,
      filtersData,
      focusAreasData.data
    );

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

  return {
    filterValues,
    isLoading: isLoadingFilters || isLoadingFocusAreas,
    isError: isFiltersError || isFocusAreasError,
  };
}
