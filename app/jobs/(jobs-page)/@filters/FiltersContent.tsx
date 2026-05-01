'use client';

import { useJobsAnalytics } from '@/analytics/jobs.analytics';
import Error from '@/components/core/error';
import { FiltersPanelSkeletonLoader } from '@/components/core/dashboard-pages-layout';
import { FiltersSidePanel } from '@/components/common/filters/FiltersSidePanel';
import { JobsFilterBody } from '@/components/page/jobs/JobsFilterBody';
import { useJobsFilters, useInfiniteJobsList } from '@/services/jobs/hooks/useJobsQueries';
import { useJobsFilterStore, useJobsFilterCount } from '@/services/jobs/store';

export default function FiltersContent() {
  const filtersQuery = useJobsFilters();
  const { totalRoles } = useInfiniteJobsList();
  const { clearParams } = useJobsFilterStore();
  const analytics = useJobsAnalytics();
  const appliedCount = useJobsFilterCount();

  if (filtersQuery.isError) return <Error />;
  if (filtersQuery.isLoading || !filtersQuery.data) return <FiltersPanelSkeletonLoader />;

  const onClearAll = () => {
    clearParams();
    analytics.onJobsFiltersCleared({
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
