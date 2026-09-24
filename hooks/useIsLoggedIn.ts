'use client';

import { useSyncExternalStore } from 'react';

import { getCookiesFromClient } from '@/utils/third-party.helper';

const subscribe = () => () => {};

const getSnapshot = () => !!getCookiesFromClient().authToken;

// Must stay false: the server has no cookies, so reading one here makes the
// hydrating render disagree with the server HTML (React #418).
export const getIsLoggedInServerSnapshot = () => false;

export function useIsLoggedIn(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getIsLoggedInServerSnapshot);
}
