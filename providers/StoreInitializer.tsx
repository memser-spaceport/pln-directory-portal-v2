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
    actions.setCurrentUser(userInfo);
  }, [userInfo, actions]);

  return null;
}
