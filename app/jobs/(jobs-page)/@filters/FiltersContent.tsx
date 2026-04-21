'use client';

import { useSearchParams } from 'next/navigation';
import { useJobsAnalytics } from '@/analytics/jobs.analytics';
import Error from '@/components/core/error';
import { FiltersPanelSkeletonLoader } from '@/components/core/dashboard-pages-layout';
import { FiltersSidePanel } from '@/components/common/filters/FiltersSidePanel';
import JobsFilterBody from '@/components/page/jobs/JobsFilterBody';
import { useJobsFilters, useInfiniteJobsList } from '@/services/jobs/useJobsQueries';
import { useJobsParamsUpdater } from '@/services/jobs/useJobsParamsUpdater';

export default function FiltersContent() {
  const searchParams = useSearchParams();
  const filtersQuery = useJobsFilters();
  const { totalRoles } = useInfiniteJobsList();
  const { clearAll } = useJobsParamsUpdater();
  const analytics = useJobsAnalytics();

  const qFromUrl = searchParams.get('q') ?? '';

  const appliedCount =
    (qFromUrl ? 1 : 0) +
    searchParams.getAll('roleCategory').length +
    searchParams.getAll('seniority').length +
    searchParams.getAll('focus').length +
    searchParams.getAll('location').length;

  if (filtersQuery.isError) return <Error />;
  if (filtersQuery.isLoading || !filtersQuery.data) return <FiltersPanelSkeletonLoader />;

  const onClearAll = () => {
    clearAll();
    analytics.onJobsFiltered({
      filter_type: 'clear_all',
      filter_value: null,
      result_count: totalRoles,
      filter_state: {},
    });
  };

  return (
    <FiltersSidePanel clearParams={onClearAll} appliedFiltersCount={appliedCount} hideFooter>
      <JobsFilterBody />
    </FiltersSidePanel>
  );
}
