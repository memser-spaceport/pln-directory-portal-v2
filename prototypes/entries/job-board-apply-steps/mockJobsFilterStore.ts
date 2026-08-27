'use client';

import { useSyncExternalStore } from 'react';
import type { FilterState } from '@/services/filters/types';

/**
 * Mock of the production `useJobsFilterStore` (Zustand + URL sync) so the prototype
 * can reuse the real filter components (FiltersSidePanel, FilterSection,
 * GenericCheckboxList, SearchInput) verbatim. Implements the same `FilterState`
 * shape — a URLSearchParams mirror with setParam/clearParams — backed by a tiny
 * module-level external store. Mirrors entries/teams/mockTeamFilterStore.ts.
 */
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

export function useMockJobsFilterStore<T = FilterState>(selector?: (s: FilterState) => T): T {
  const params = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const state: FilterState = { params, setParam, clearParams, setAllParams, _clearImmediate: false };
  return selector ? selector(state) : (state as unknown as T);
}
