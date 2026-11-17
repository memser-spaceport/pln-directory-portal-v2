'use client';

import { useSyncExternalStore } from 'react';

import { URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';
import { FILTER_VALUE_SEPARATOR, FILTER_VALUE_SEPARATOR_ENCODED } from '@/constants/filters';
import type { FilterState } from '@/services/filters/types';

/**
 * Mock of a production filter store (Zustand + URL sync), so the events rail can reuse the
 * directory's filter components as they are: FiltersSidePanel, FilterSection,
 * GenericCheckboxList, GenericFilterToggle, MobileFilterWrapper. Same `FilterState` shape,
 * backed by a module-level external store. Copied from `ai-apps/mockAiAppsFilterStore`.
 */

/** Params that count toward the panel's applied-filters badge. */
export const COUNTED_PARAMS = ['search', 'going', 'featured', 'mode', 'access', 'focus', 'gathering', 'host'];

export const countAppliedFilters = (params: URLSearchParams) => COUNTED_PARAMS.filter((k) => params.get(k)).length;

/** Multi-value params arrive encoded the way GenericCheckboxList writes them. */
export function decodeMulti(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(URL_QUERY_VALUE_SEPARATOR)
    .map((r) => r.trim().replaceAll(FILTER_VALUE_SEPARATOR_ENCODED, FILTER_VALUE_SEPARATOR))
    .filter(Boolean);
}

export function encodeMulti(values: string[]) {
  return values
    .map((v) => v.replaceAll(FILTER_VALUE_SEPARATOR, FILTER_VALUE_SEPARATOR_ENCODED))
    .join(URL_QUERY_VALUE_SEPARATOR);
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

/** Compatible with `() => FilterState` and the `store(selector)` form. */
export function useEventsFilterStore<T = FilterState>(selector?: (s: FilterState) => T): T {
  const params = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const state: FilterState = { params, setParam, clearParams, setAllParams, _clearImmediate: false };
  return selector ? selector(state) : (state as unknown as T);
}
