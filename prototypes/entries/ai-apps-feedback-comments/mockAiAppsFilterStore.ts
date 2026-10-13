'use client';

import { useSyncExternalStore } from 'react';
import type { FilterState } from '@/services/filters/types';

/**
 * Mock of a production filter store (Zustand + URL sync) so this prototype can
 * reuse the real filter components — FiltersSidePanel, FilterSection,
 * GenericCheckboxList, MobileFilterWrapper — verbatim. Same `FilterState` shape
 * (a URLSearchParams mirror with setParam/clearParams), backed by a tiny
 * module-level external store. Copied from the teams prototype's
 * `mockTeamFilterStore`, which does the same job for the teams rail.
 */

/**
 * Sort keys. "Recently updated" is the resting order, not "Default": a sandbox
 * of experiments is read for what changed, and the mock array order is not an
 * order anyone chose. Teams ships a `Default` option because its backend has a
 * real relevance ranking to fall back to; there is none here, so offering one
 * would name an order that doesn't exist.
 */
export const AI_APPS_SORT = {
  UPDATED: 'updated',
  CREATED: 'created',
  NAME: 'name',
  VIEWS: 'views',
} as const;

export const AI_APPS_SORT_OPTIONS = [
  { value: AI_APPS_SORT.UPDATED, label: 'Recently updated' },
  { value: AI_APPS_SORT.CREATED, label: 'Recently added' },
  { value: AI_APPS_SORT.NAME, label: 'A-Z (Ascending)' },
  { value: AI_APPS_SORT.VIEWS, label: 'Most viewed' },
];

const defaultParams = () => new URLSearchParams({ sort: AI_APPS_SORT.UPDATED });

let _params = defaultParams();
const listeners = new Set<() => void>();

/**
 * Params that count toward the "applied filters" badge. One copy, imported by
 * both the panel and the page, so the badge and the filtering can't drift.
 * `sort` is deliberately absent — re-ordering a list is not narrowing it, and a
 * badge that counts the sort would read "1 filter applied" on an untouched page.
 */
export const COUNTED_PARAMS = ['search', 'createdBy'];

export function countAppliedFilters(params: URLSearchParams) {
  return COUNTED_PARAMS.filter((k) => params.get(k)).length;
}

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

/** Clearing filters means "back to the default view", so the default sort survives. */
function clearParams() {
  _params = defaultParams();
  emit();
}

function setAllParams(p: URLSearchParams) {
  _params = new URLSearchParams(p.toString());
  emit();
}

/**
 * Hook compatible with `() => FilterState` (and the `store(selector)` form some
 * consumers use). Re-renders subscribers whenever any param changes.
 */
export function useMockAiAppsFilterStore<T = FilterState>(selector?: (s: FilterState) => T): T {
  const params = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const state: FilterState = { params, setParam, clearParams, setAllParams, _clearImmediate: false };
  return selector ? selector(state) : (state as unknown as T);
}
