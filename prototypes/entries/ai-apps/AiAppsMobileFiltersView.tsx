'use client';

import { MobileFilterWrapper } from '@/components/common/filters/MobileFilterWrapper';

import { AiAppsFilterView } from './AiAppsFilterView';
import { AI_APPS_SORT, AI_APPS_SORT_OPTIONS, useMockAiAppsFilterStore } from './mockAiAppsFilterStore';
import type { AiAppWithDoc } from './mocks';

interface Props {
  apps: AiAppWithDoc[];
  filterCount: number;
}

/**
 * Mobile "⊕ Filters" pill + sort menu + bottom-sheet, reusing the shared
 * `MobileFilterWrapper` verbatim (it hides itself at ≥1024). Same wiring the
 * teams prototype uses; analytics dropped.
 */
export function AiAppsMobileFiltersView({ apps, filterCount }: Props) {
  const { params, setParam, clearParams } = useMockAiAppsFilterStore();
  const currentSort = params.get('sort') || AI_APPS_SORT.UPDATED;

  return (
    <MobileFilterWrapper
      filterCount={filterCount}
      currentSort={currentSort}
      sortOptions={AI_APPS_SORT_OPTIONS}
      sortByLabel="Sort by:"
      onSortChange={(v) => setParam('sort', v)}
      onClearFilters={clearParams}
      renderFilter={(onClose) => <AiAppsFilterView apps={apps} onClose={onClose} />}
    />
  );
}
