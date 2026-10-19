'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * False on the server and during hydration, true after: for UI that must not appear in the server HTML because
 * it depends on browser-only state (LAB-2888: the mobile filter bars read a filter store that is filled from the
 * URL in the browser, so rendering them earlier would flash "no filters" over a filtered link).
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
