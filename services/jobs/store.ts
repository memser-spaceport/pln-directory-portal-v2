import { createFilterStore, useFilterCount } from '@/services/filters';

export const useJobsFilterStore = createFilterStore({
  namespace: 'jobs',
  trackedParams: ['q', 'roleCategory', 'seniority', 'focus', 'location', 'sort'],
});

export function useJobsFilterCount() {
  return useFilterCount(useJobsFilterStore, {
    excludeParams: ['sort'],
  });
}
