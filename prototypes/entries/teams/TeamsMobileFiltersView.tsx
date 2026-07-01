'use client';

import { SORT_OPTIONS } from '@/utils/constants';
import { MobileFilterWrapper } from '@/components/common/filters/MobileFilterWrapper';

import { useMockTeamFilterStore } from './mockTeamFilterStore';
import { TeamsFilterView } from './TeamsFilterView';

const SORT_OPTIONS_LIST = [
  { value: SORT_OPTIONS.ASCENDING, label: 'A-Z (Ascending)' },
  { value: SORT_OPTIONS.DESCENDING, label: 'Z-A (Descending)' },
];

/**
 * COPY-SIMPLIFY of production `TeamsMobileFilters`. Reuses the shared
 * `MobileFilterWrapper` (the "⊕ Filters" pill + sort menu + bottom-sheet dialog)
 * verbatim, wired to the mock store; analytics dropped. Mobile-only (the wrapper
 * hides itself at ≥1024).
 */
export function TeamsMobileFiltersView({ filterCount }: { filterCount: number }) {
  const { params, setParam, clearParams } = useMockTeamFilterStore();
  const currentSort = params.get('sort') || SORT_OPTIONS.ASCENDING;

  return (
    <MobileFilterWrapper
      filterCount={filterCount}
      currentSort={currentSort}
      sortOptions={SORT_OPTIONS_LIST}
      sortByLabel="Sort by:"
      onSortChange={(v) => setParam('sort', v)}
      onClearFilters={clearParams}
      renderFilter={(onClose) => <TeamsFilterView onClose={onClose} />}
    />
  );
}
