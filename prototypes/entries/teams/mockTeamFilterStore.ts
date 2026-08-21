'use client';

import { useSyncExternalStore } from 'react';
import type { FilterState } from '@/services/filters/types';

/**
 * Mock of the production `useTeamFilterStore` (Zustand) so the prototype can
 * reuse the real filter components (GenericCheckboxList, GenericFilterToggle,
 * FilterCheckSizeInput, FilterTagInput) verbatim. It implements the same
 * `FilterState` shape — a URLSearchParams mirror with setParam/clearParams —
 * backed by a tiny module-level external store instead of Zustand + URL sync.
 */
/**
 * Params the panel arrives with. `showInactive` is on by default: a team that
 * has wound down still has a real profile with real people and real history on
 * it, and a directory that silently drops it answers "is this team in the
 * network?" with a no. It's in the list, wearing its state, and the toggle is
 * how you take it out.
 *
 * Anything seeded here has to survive Clear all — clearing filters means
 * "back to the default view", not "back to empty", and those are different
 * sets the moment a default is anything but off.
 */
const defaultParams = () => new URLSearchParams({ showInactive: 'true' });

let _params = defaultParams();
const listeners = new Set<() => void>();

/**
 * Params that count toward the "applied filters" badge. One copy, imported by
 * both the panel and the page — they have to agree, and they used to hold
 * separate lists that could quietly drift.
 */
export const COUNTED_PARAMS = [
  'membershipSources',
  'tags',
  'fundingStage',
  'isFund',
  'minTypicalCheckSize',
  'maxTypicalCheckSize',
  'investmentFocus',
];

/**
 * `showInactive` is counted by its *deviation from the default*, not by its
 * presence: it ships on, so having it on is the resting state and badging the
 * panel "1" on a view nobody has touched would be a lie. Switching it off is
 * the narrowing, so that's what counts.
 */
export function countAppliedFilters(params: URLSearchParams) {
  const explicit = COUNTED_PARAMS.filter((k) => params.get(k)).length;
  return explicit + (params.get('showInactive') === 'true' ? 0 : 1);
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
export function useMockTeamFilterStore<T = FilterState>(selector?: (s: FilterState) => T): T {
  const params = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const state: FilterState = { params, setParam, clearParams, setAllParams, _clearImmediate: false };
  return selector ? selector(state) : (state as unknown as T);
}
