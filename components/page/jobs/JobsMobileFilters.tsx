'use client';

import { useSearchParams } from 'next/navigation';
import { useJobsAnalytics } from '@/analytics/jobs.analytics';
import { MobileFilterWrapper } from '@/components/common/filters/MobileFilterWrapper';
import JobsFilterBody from '@/components/page/jobs/JobsFilterBody';
import { useInfiniteJobsList } from '@/services/jobs/hooks/useJobsQueries';
import { useJobsParamsUpdater } from '@/services/jobs/hooks/useJobsParamsUpdater';
import { filterStateFromURL } from '@/utils/jobs.utils';

const SORT_OPTIONS = [
  { value: 'company_az', label: 'A-Z (Ascending)' },
  { value: 'newest', label: 'Newest' },
];

export default function JobsMobileFilters() {
  const searchParams = useSearchParams();
  const { setParam, clearAll } = useJobsParamsUpdater();
  const { totalRoles } = useInfiniteJobsList();
  const analytics = useJobsAnalytics();

  const currentSort = searchParams.get('sort') ?? 'newest';
  const qFromUrl = searchParams.get('q') ?? '';

  const filterCount =
    (qFromUrl ? 1 : 0) +
    searchParams.getAll('roleCategory').length +
    searchParams.getAll('seniority').length +
    searchParams.getAll('focus').length +
    searchParams.getAll('location').length;

  const onSortChange = (value: string) => {
    setParam('sort', value === 'newest' ? null : value);
    analytics.onJobsSortChanged({ sort_key: value, result_count: totalRoles });
  };

  const onClearFilters = () => {
    clearAll();
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
