import { useMemo } from 'react';
import { FilterState } from './types';

export interface UseFilterCountConfig {
  /**
   * Parameters to exclude from counting
   * @example ['viewType', 'sort', 'page']
   */
  excludeParams?: string[];

  /**
   * Custom logic to determine if a parameter should count
   * @param key - Parameter key
   * @param value - Parameter value
   * @returns true if parameter should be counted
   */
  shouldCount?: (key: string, value: string) => boolean;
}

/**
 * Automatically count active filters from a filter store
 *
 * @param filterStore - The filter store hook to use
 * @param config - Optional configuration
 *
 * @example
 * ```typescript
 * const useMemberFilterStore = createFilterStore({...});
 *
 * function MyComponent() {
 *   const filterCount = useFilterCount(useMemberFilterStore, {
 *     excludeParams: ['viewType', 'sort'],
 *   });
 *
 *   return <div>Active filters: {filterCount}</div>;
 * }
 * ```
 */
export function useFilterCount(
  filterStore: () => FilterState,
  config: UseFilterCountConfig = {},
): number {
  const { params } = filterStore();
  const { excludeParams = [], shouldCount } = config;

  return useMemo(() => {
    let count = 0;

    params.forEach((value, key) => {
      // Skip excluded parameters
      if (excludeParams.includes(key)) {
        return;
      }

      // Use custom logic if provided
      if (shouldCount) {
        if (shouldCount(key, value)) {
          count += 1;
        }
        return;
      }

      // Default logic: count if value exists and is not 'false'
      // (false values typically represent disabled toggles)
      if (value && value.trim() !== '' && value !== 'false') {
        count += 1;
      }
    });

    return count;
  }, [params, excludeParams, shouldCount]);
}
