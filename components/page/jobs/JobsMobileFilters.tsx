'use client';

import { useJobsAnalytics } from '@/analytics/jobs.analytics';
import { MobileFilterWrapper } from '@/components/common/filters/MobileFilterWrapper';
import { JobsFilterBody } from '@/components/page/jobs/JobsFilterBody';
import { useInfiniteJobsList } from '@/services/jobs/hooks/useJobsQueries';
import { useJobsFilterStore, useJobsFilterCount } from '@/services/jobs/store';

const SORT_OPTIONS = [
  { value: 'company_az', label: 'A-Z (Ascending)' },
  { value: 'newest', label: 'Newest' },
];

export default function JobsMobileFilters() {
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

  return (
    <MobileFilterWrapper
      filterCount={filterCount}
      currentSort={currentSort}
      sortOptions={SORT_OPTIONS}
      sortByLabel="Sort by:"
      onSortChange={onSortChange}
      onClearFilters={onClearFilters}
      renderFilter={() => <JobsFilterBody />}
    />
  );
}
