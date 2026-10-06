'use client';

import { useSyncExternalStore } from 'react';
import type { FilterState } from '@/services/filters/types';

/**
 * The Feedback page's filter store: same shape as `mockAiAppsFilterStore` (a
 * URLSearchParams mirror with setParam/clearParams), so production's rail
 * pieces (FiltersSidePanel, FilterSearchInput, GenericCheckboxList) run on it
 * verbatim. Its own module-level store, so the grid's filters and the Feedback
 * page's never leak into each other (2026-10-06: filters moved to the left rail).
 */

/** Param keys, one per rail section. Multi-select values are `|`-joined (encodeFilterValues). */
export const FEEDBACK_PARAM = {
  SEARCH: 'search',
  TYPE: 'type',
  APP: 'app',
  STATUS: 'status',
  KIND: 'kind',
  PRIORITY: 'priority',
  FROM: 'from',
} as const;

const COUNTED = Object.values(FEEDBACK_PARAM);

export function countAppliedFeedbackFilters(params: URLSearchParams) {
  return COUNTED.filter((k) => params.get(k)).length;
}

let _params = new URLSearchParams();
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const getSnapshot = () => _params;

function setParam(key: string, value?: string) {
  const next = new URLSearchParams(_params.toString());
  if (value === undefined || value === '') next.delete(key);
  else next.set(key, value);
  _params = next;
  emit();
}

function clearParams() {
  _params = new URLSearchParams();
  emit();
}

function setAllParams(p: URLSearchParams) {
  _params = new URLSearchParams(p.toString());
  emit();
}

export function useMockFeedbackFilterStore<T = FilterState>(selector?: (s: FilterState) => T): T {
  const params = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const state: FilterState = { params, setParam, clearParams, setAllParams, _clearImmediate: false };
  return selector ? selector(state) : (state as unknown as T);
}

/** Outside React (tab switches): drop the facets whose options belong to one tab. */
export function clearFeedbackParams(keys: string[]) {
  const next = new URLSearchParams(_params.toString());
  keys.forEach((k) => next.delete(k));
  _params = next;
  emit();
}
