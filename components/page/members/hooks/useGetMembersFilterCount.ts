import { useFilterStore } from '@/services/members/store';
import { useFilterCount } from '@/services/filters';

/**
 * Get count of active filters for members
 *
 * Now uses the generic useFilterCount hook with member-specific configuration.
 * Automatically counts all active filters except viewType, sort, and page.
 */
export function useGetMembersFilterCount() {
  return useFilterCount(useFilterStore, {
    // Exclude non-filter parameters from counting
    excludeParams: ['viewType', 'sort', 'page', 'q'],
  });
}
