'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { ITeamsSearchParams } from '@/types/teams.types';
import { fetchFiltersData, fetchFocusAreas, fetchIndustryTags, fetchMembershipSource } from '../teamsApi';
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

  const {
    data: membershipSourceData,
    isLoading: isLoadingMembershipSourceData,
    isError: isMembershipSourceError,
  } = useQuery({
    queryKey: ['teams', 'membership-source'],
    queryFn: () => fetchMembershipSource(searchParams),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const {
    data: industryTags,
    isLoading: isLoadingIndustryTags,
    isError: isIndustryTagsError,
  } = useQuery({
    queryKey: ['teams', 'industry-tags'],
    queryFn: () => fetchIndustryTags(searchParams),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Process filter values
  const filterValues = useMemo(() => {
    if (!filtersData || !focusAreasData) return null;

    const processed = processFilters({
      searchParams,
      formattedValuesByFilter: filtersData,
      formattedAvailableValuesByFilter: filtersData,
      focusAreaData: focusAreasData.data,
      membershipSourceData: membershipSourceData?.data || [],
      industryTags: industryTags?.data || [],
    });

    // Handle 'all' asks selection
    if (searchParams?.asks === 'all') {
      processed.asks.forEach((ask) => {
        if (!ask.disabled) {
          ask.selected = true;
        }
      });
    }

    return processed;
  }, [industryTags, searchParams, filtersData, focusAreasData, membershipSourceData]);

  return {
    filterValues,
    isLoading: isLoadingFilters || isLoadingFocusAreas || isLoadingMembershipSourceData || isLoadingIndustryTags,
    isError: isFiltersError || isFocusAreasError || isMembershipSourceError || isIndustryTagsError,
  };
}
