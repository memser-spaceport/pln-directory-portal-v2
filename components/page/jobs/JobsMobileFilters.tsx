'use client';

import { useJobsAnalytics } from '@/analytics/jobs.analytics';
import { MobileFilterWrapper } from '@/components/common/filters/MobileFilterWrapper';
import { useIsClient } from '@/hooks/useIsClient';
import { JobsFilterBody } from '@/components/page/jobs/JobsFilterBody';
import { useInfiniteJobsList } from '@/services/jobs/hooks/useJobsQueries';
import { useJobsFilterStore, useJobsFilterCount } from '@/services/jobs/store';
import { JOBS_SORT_OPTIONS } from '@/services/jobs/constants';

interface JobsMobileFiltersProps {
  isLoggedIn: boolean;
}

export default function JobsMobileFilters({ isLoggedIn }: JobsMobileFiltersProps) {
  const isClient = useIsClient();
  const { params, setParam, clearParams } = useJobsFilterStore();
  const { totalRoles } = useInfiniteJobsList();
  const analytics = useJobsAnalytics();
  const filterCount = useJobsFilterCount();

  const currentSort = params.get('sort') ?? 'newest';

  const onSortChange = (value: string) => {
    setParam('sort', value === 'newest' ? undefined : value);
    analytics.onJobsSortChanged({ sort_key: value, result_count: totalRoles });
  };

  const onClearFilters = () => {
    clearParams();
    analytics.onJobsFiltersCleared({
      result_count: totalRoles,
      filter_state: {},
    });
  };

  /* Not in the server HTML (LAB-2888): the store it reads is filled from the URL in the browser. The board above
     it is server-rendered; this bar appears right after hydration with the URL's filters already in it. */
  if (!isClient) return null;

  return (
    <MobileFilterWrapper
      filterCount={filterCount}
      currentSort={currentSort}
      sortOptions={JOBS_SORT_OPTIONS}
      sortByLabel="Sort by:"
      onSortChange={onSortChange}
      onClearFilters={onClearFilters}
      renderFilter={() => <JobsFilterBody isLoggedIn={isLoggedIn} />}
    />
  );
}
