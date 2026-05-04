'use client';

import { useCurrentUserStore } from '@/services/auth/store';
import { IUserInfo } from '@/types/shared.types';
import { useEffect } from 'react';

interface StoreInitializerProps {
  userInfo: IUserInfo | null;
}

export default function StoreInitializer({ userInfo }: StoreInitializerProps) {
  const { actions } = useCurrentUserStore();

  useEffect(() => {
    actions.setCurrentUser(userInfo);
  }, [userInfo, actions]);

  return null;
}
