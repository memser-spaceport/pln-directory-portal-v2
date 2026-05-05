'use client';

import { useCurrentUserStore } from '@/services/auth/store';
import { IUserInfo } from '@/types/shared.types';
import { useEffect, useLayoutEffect } from 'react';

// useLayoutEffect fires synchronously before paint (no flash), but triggers a
// React warning during SSR. Use useEffect on the server where effects don't run.
const useSyncLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

interface StoreInitializerProps {
  userInfo: IUserInfo | null;
}

export default function StoreInitializer({ userInfo }: StoreInitializerProps) {
  const { actions } = useCurrentUserStore();

  useSyncLayoutEffect(() => {
    // Skip if UserInfoChecker already enriched the store with fresher API data,
    // unless this is a logout (null) — always honour that.
    if (userInfo === null || !useCurrentUserStore.getState().isEnrichedByApi) {
      actions.setCurrentUser(userInfo);
    }
  }, [userInfo, actions]);

  return null;
}
