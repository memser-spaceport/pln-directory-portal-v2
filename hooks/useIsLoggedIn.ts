'use client';

import { useSyncExternalStore } from 'react';

import { getCookiesFromClient } from '@/utils/third-party.helper';

// Cookies fire no change event, so there is nothing to subscribe to: the value
// is read once per render pass and only changes across a navigation.
const subscribe = () => () => {};

const getSnapshot = () => !!getCookiesFromClient().authToken;

/**
 * The server has no cookies of its own, so it must always render the signed-out
 * tree. Pinning the server snapshot to false keeps SSR and the hydrating client
 * render in agreement; reading the cookie during that first render instead
 * produces a tree the server never sent, and React fails hydration with #418,
 * discards the server HTML for that subtree and re-renders it on the client.
 */
export const getIsLoggedInServerSnapshot = () => false;

/**
 * Whether this browser holds an auth cookie.
 *
 * Presentation only. It reports that a cookie is present, not that the session
 * behind it is valid, which only the API can say.
 */
export function useIsLoggedIn(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getIsLoggedInServerSnapshot);
}
