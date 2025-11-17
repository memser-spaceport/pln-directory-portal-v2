import { useTeamFilterStore } from '../store';
import { useFilterCount } from '@/services/filters';

/**
 * Get count of active filters for teams
 *
 * Automatically counts all active filters except sort, page, and view params.
 */
export function useTeamFilterCount() {
  return useFilterCount(useTeamFilterStore, {
    // Exclude non-filter parameters from counting
    excludeParams: ['sort', 'page', 'viewType', 'q'],
  });
}
