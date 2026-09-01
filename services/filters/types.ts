/**
 * Filter Store Types
 *
 * Generic types for creating reusable filter stores across different pages
 */

export interface FilterState {
  params: URLSearchParams;
  setParam: (key: string, value?: string) => void;
  clearParams: () => void;
  setAllParams: (params: URLSearchParams) => void;
  _clearImmediate: boolean; // Internal flag to signal immediate clear
}

/**
 * A store hook produced by `createFilterStore`.
 *
 * Callable bare (`store()`) for the whole state, or with a selector
 * (`store((s) => s.setAllParams)`) to subscribe to one slice. Components that
 * accept a store as a prop should type it with this rather than
 * `() => FilterState`, which loses the selector overload.
 */
export interface FilterStoreHook {
  (): FilterState;
  <T>(selector: (state: FilterState) => T): T;
  /** The keys this store declared as URL-tracked, from `createFilterStore`. */
  trackedParams?: readonly string[];
}

export interface FilterStoreConfig {
  /**
   * Namespace for the filter store (e.g., 'members', 'teams', 'projects')
   */
  namespace: string;

  /**
   * List of parameter keys that should be tracked and synced to URL
   */
  trackedParams: readonly string[];

  /**
   * Optional callback fired when filter changes
   * Useful for analytics tracking
   */
  onFilterChange?: (key: string, value: string | undefined, allParams: URLSearchParams) => void;

  /**
   * Debounce time in milliseconds for analytics callback
   * @default 300
   */
  analyticsDebounceMs?: number;
}
