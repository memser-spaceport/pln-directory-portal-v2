'use client';

/**
 * A stand-in for `useFilterStore` (services/members/store).
 *
 * The production filter components take their store as a *prop*
 * (`filterStore: () => FilterState`), so they aren't really store-bound — they
 * are dependency-injected. Satisfying that five-member interface lets the
 * prototype import `GenericCheckboxList`, `GenericFilterToggle`,
 * `FilterCheckSizeInput` and `FilterTagInput` for real instead of
 * copy-simplifying four components.
 *
 * The only thing dropped versus production is URL syncing — state lives in
 * memory, which is what a prototype wants anyway.
 */

import { useSyncExternalStore } from 'react';
import type { FilterState } from '@/services/filters/types';

// Seeded so the Members tab lands on a state that shows the feature working:
// a city plus "Next 30 days", which is what makes travellers — and their blue
// travel badges — appear in the grid on arrival. Without a window ticked the
// city list matches home cities only and the page looks exactly like today's.
// '|' is production's URL_QUERY_VALUE_SEPARATOR, which is what
// GenericCheckboxList reads and writes.
let params = new URLSearchParams('city=Berlin&presence=month');
const listeners = new Set<() => void>();

const emit = () => {
  // A fresh instance each time, so useSyncExternalStore sees a new snapshot.
  params = new URLSearchParams(params.toString());
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => params;

export function setParam(key: string, value?: string) {
  if (value === undefined || value === '') params.delete(key);
  else params.set(key, value);
  emit();
}

export function clearParams() {
  params = new URLSearchParams();
  emit();
}

function setAllParams(next: URLSearchParams) {
  params = new URLSearchParams(next.toString());
  emit();
}

export function useMockFilterStore(): FilterState {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { params: snapshot, setParam, clearParams, setAllParams, _clearImmediate: false };
}

/** How many filters are active — feeds FiltersSidePanel's count badge. */
export function useAppliedFilterCount(extra = 0): number {
  const { params: current } = useMockFilterStore();
  return [...current.keys()].length + extra;
}

/** Build a `useGetDataHook` for GenericCheckboxList from a static list. */
export function staticOptions(options: { value: string; label: string; count?: number }[]) {
  return (input: string) => {
    const needle = input.trim().toLowerCase();
    return { data: needle ? options.filter((o) => o.label.toLowerCase().includes(needle)) : options };
  };
}
