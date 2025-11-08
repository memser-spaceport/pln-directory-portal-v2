/**
 * Generic Filter Infrastructure
 *
 * Reusable utilities for building filter systems across different pages.
 * Provides state management, URL synchronization, and common filter patterns.
 */

export { createFilterStore } from './createFilterStore';
export { useFilterCount } from './useFilterCount';
export type { FilterState, FilterStoreConfig } from './types';
export type { UseFilterCountConfig } from './useFilterCount';
