'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { IUserInfo } from '@/types/shared.types';
import { useMemberApprovalEvents } from '@/services/members/hooks/useMemberApprovalEvents';

interface Props {
  isLoggedIn: boolean;
  userInfo: IUserInfo;
}

export const LoginFlowTrigger = ({ isLoggedIn }: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isLoginFlow = searchParams.get('loginFlow') === 'login';

  useEffect(() => {
    if (!isLoggedIn && isLoginFlow) {
      router.push(`${window.location.pathname}${window.location.search}#login`);
    }
  }, [isLoggedIn, router, isLoginFlow]);

  useMemberApprovalEvents();

  return null;
};
