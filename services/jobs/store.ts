import { createFilterStore, useFilterCount } from '@/services/filters';

import { SAVED_PARAM } from './savedParam';

export const useJobsFilterStore = createFilterStore({
  namespace: 'jobs',
  trackedParams: ['q', 'roleCategory', 'seniority', 'focus', 'location', 'workplaceType', 'sort', SAVED_PARAM],
});

export function useJobsFilterCount() {
  return useFilterCount(useJobsFilterStore, {
    excludeParams: ['sort'],
  });
}
