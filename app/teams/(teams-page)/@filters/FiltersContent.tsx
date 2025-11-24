'use client';

import { ITeamsSearchParams } from '@/types/teams.types';
import { IUserInfo } from '@/types/shared.types';
import Error from '../../../../components/core/error';
import FilterWrapper from '../../../../components/page/teams/filter-wrapper';
import { FiltersPanelSkeletonLoader } from '@/components/core/dashboard-pages-layout';
import { useTeamsFilters } from '../hooks/useTeamsFilters';

interface FiltersContentProps {
  searchParams: ITeamsSearchParams;
  userInfo: IUserInfo | undefined;
}

export default function FiltersContent({ searchParams, userInfo }: FiltersContentProps) {
  const { filterValues, isLoading, isError } = useTeamsFilters(searchParams);

  if (isError) {
    return <Error />;
  }

  if (isLoading) {
    return <FiltersPanelSkeletonLoader />;
  }

  if (!filterValues) {
    return null;
  }

  return <FilterWrapper searchParams={searchParams} filterValues={filterValues} userInfo={userInfo!} />;
}
