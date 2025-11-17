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
