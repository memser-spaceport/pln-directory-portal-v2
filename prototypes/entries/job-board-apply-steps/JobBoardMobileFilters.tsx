'use client';

import { MobileFilterWrapper } from '@/components/common/filters/MobileFilterWrapper';
import { JOBS_SORT_OPTIONS } from '@/services/jobs/constants';

import { useMockJobsFilterStore } from './mockJobsFilterStore';
import { JobBoardFilterView } from './JobBoardFilterView';

const COUNTED_PARAMS = ['roleCategory', 'seniority', 'workplaceType', 'location'];

/**
 * COPY-SIMPLIFY of production `JobsMobileFilters`. Reuses the shared
 * `MobileFilterWrapper` (the "⊕ Filters" pill + sort menu + bottom-sheet dialog)
 * verbatim, wired to the mock store; analytics dropped. Shown only below 1024
 * (its container hides at the desktop breakpoint).
 */
export function JobBoardMobileFilters() {
  const { params, setParam, clearParams } = useMockJobsFilterStore();
  const currentSort = params.get('sort') ?? 'newest';
  const filterCount = COUNTED_PARAMS.filter((k) => params.get(k)).length;

  return (
    <MobileFilterWrapper
      filterCount={filterCount}
      currentSort={currentSort}
      sortOptions={JOBS_SORT_OPTIONS}
      sortByLabel="Sort by:"
      onSortChange={(v) => setParam('sort', v === 'newest' ? undefined : v)}
      onClearFilters={clearParams}
      renderFilter={(onClose) => <JobBoardFilterView onClose={onClose} />}
    />
  );
}
