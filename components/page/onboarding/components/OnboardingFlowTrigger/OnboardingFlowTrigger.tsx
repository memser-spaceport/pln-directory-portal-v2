'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { IUserInfo } from '@/types/shared.types';
import { OnboardingWizard } from '@/components/page/onboarding/components/OnboardingWizard';
import { useMember } from '@/services/members/hooks/useMember';

interface Props {
  isLoggedIn: boolean;
  userInfo: IUserInfo;
}

export const OnboardingFlowTrigger = ({ isLoggedIn, userInfo }: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOnboardingLoginFlow = searchParams.get('loginFlow') === 'onboarding';
  const { data: memberData } = useMember(userInfo.uid);

  useEffect(() => {
    if (!isLoggedIn && isOnboardingLoginFlow) {
      router.push(`${window.location.pathname}${window.location.search}#login`);
    }
  }, [isLoggedIn, router, isOnboardingLoginFlow]);

  if (!isLoggedIn || !isOnboardingLoginFlow || !memberData?.memberInfo) {
    return null;
  }

  return <OnboardingWizard userInfo={userInfo} isLoggedIn={isLoggedIn} memberData={memberData} />;
};
