'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { IUserInfo } from '@/types/shared.types';
import { useLoginRedirect } from '@/components/core/login/utils';
import { useMemberApprovalEvents } from '@/services/members/hooks/useMemberApprovalEvents';

interface Props {
  isLoggedIn: boolean;
  userInfo: IUserInfo;
}

export const LoginFlowTrigger = ({ isLoggedIn }: Props) => {
  const searchParams = useSearchParams();
  const goToLogin = useLoginRedirect();
  const isLoginFlow = searchParams.get('loginFlow') === 'login';

  useEffect(() => {
    if (!isLoggedIn && isLoginFlow) {
      goToLogin();
    }
  }, [isLoggedIn, goToLogin, isLoginFlow]);

  useMemberApprovalEvents();

  return null;
};
