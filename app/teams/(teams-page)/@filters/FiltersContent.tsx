'use client';

import { ITeamsSearchParams } from '@/types/teams.types';
import { IUserInfo } from '@/types/shared.types';
import Error from '../../../../components/core/error';
import { TeamsFilterWrapper } from '../../../../components/page/teams/TeamsFilterWrapper';
import { FiltersPanelSkeletonLoader } from '@/components/core/dashboard-pages-layout';
import { useTeamsFilters } from '../hooks/useGetTeamsFilterValues';

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

  return <TeamsFilterWrapper searchParams={searchParams} filterValues={filterValues} userInfo={userInfo!} />;
}
