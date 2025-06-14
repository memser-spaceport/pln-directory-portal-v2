'use client';

import { useUserStore } from '@/services/members/store';
import { IUserInfo } from '@/types/shared.types';
import { useEffect } from 'react';

interface StoreInitializerProps {
  userInfo: IUserInfo | null;
}

export default function StoreInitializer({ userInfo }: StoreInitializerProps) {
  const { actions } = useUserStore();

  useEffect(() => {
    if (userInfo?.profileImageUrl) {
      actions.setProfileImage(userInfo.profileImageUrl);
    }
  }, [userInfo, actions]);

  return null;
} 