import { create } from 'zustand';
import { FilterState, FilterStoreConfig } from './types';

/**
 * Generic Filter Store Factory
 *
 * Creates a Zustand store for managing filter state with URL synchronization.
 * Handles analytics callbacks with debouncing to avoid excessive tracking calls.
 *
 * @example
 * ```typescript
 * // Create a store for members filters
 * export const useMemberFilterStore = createFilterStore({
 *   namespace: 'members',
 *   trackedParams: ['topics', 'roles', 'hasOfficeHours'],
 *   onFilterChange: (key, value, allParams) => {
 *     analytics.track('Filter Changed', { key, value });
 *   }
 * });
 * ```
 */
export function createFilterStore(config: FilterStoreConfig) {
  // Store analytics callback outside of Zustand state to avoid re-renders
  let analyticsCallback = config.onFilterChange;
  let analyticsDebounceTimer: NodeJS.Timeout | undefined;
  const debounceMs = config.analyticsDebounceMs ?? 300;

  // Debounced analytics call to ensure it only fires once per batch of changes
  const callAnalyticsDebounced = (key: string, value: string | undefined, params: URLSearchParams) => {
    if (!analyticsCallback) return;

    if (analyticsDebounceTimer) {
      clearTimeout(analyticsDebounceTimer);
    }

    analyticsDebounceTimer = setTimeout(() => {
      analyticsCallback!(key, value, params);
    }, debounceMs);
  };

  // Create and return the store
  const store = create<FilterState>((set, get) => ({
    params: new URLSearchParams(),
    _clearImmediate: false,

    setParam: (key: string, value?: string) => {
      const next = new URLSearchParams(get().params);

      if (value === undefined) {
        next.delete(key);
      } else {
        next.set(key, value);
      }

      set({ params: next, _clearImmediate: false });

      // Call analytics callback with debounce
      callAnalyticsDebounced(key, value, next);
    },

    clearParams: () => {
      const next = new URLSearchParams();
      set({ params: next, _clearImmediate: true });

      // Call analytics callback immediately for clear (no debounce)
      if (analyticsCallback) {
        if (analyticsDebounceTimer) {
          clearTimeout(analyticsDebounceTimer);
        }
        analyticsCallback('*', undefined, next);
      }
    },

    setAllParams: (params: URLSearchParams) => {
      set({ params, _clearImmediate: false });
    },
  }));

  // Attach a method to update the analytics callback dynamically if needed
  (store as any).setAnalyticsCallback = (callback: FilterStoreConfig['onFilterChange']) => {
    analyticsCallback = callback;
  };

  return store;
}
