/**
 * Common types shared across filter infrastructure
 */

/**
 * Generic option type for filters
 * Used in checkbox lists, select dropdowns, etc.
 */
export type FilterOption = {
  value: string;
  label: string;
  count?: number;
  /**
   * If true, the option is shown but not selectable
   * Used to indicate options that don't match current filter criteria
   */
  disabled?: boolean;
};
