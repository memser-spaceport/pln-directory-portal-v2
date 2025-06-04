'use client';

import React from 'react';
import { useOnboardingState } from '@/services/onboarding/store';

import { OnboardingProgress } from '@/components/page/onboarding/components/OnboardingProgress';
import { OnboardingNavigation } from '@/components/page/onboarding/components/OnboardingNavigation';

import s from './OnboardingWizard.module.scss';
import { IUserInfo } from '@/types/shared.types';
import { WelcomeStep } from '@/components/page/onboarding/components/WelcomeStep';
import { ProfileStep } from '@/components/page/onboarding/components/ProfileStep';

interface Props {
  userInfo: IUserInfo;
}

export const OnboardingWizard = ({ userInfo }: Props) => {
  const { step } = useOnboardingState();

  return (
    <div className={s.root}>
      <div className={s.content}>
        {step === 'welcome' && <WelcomeStep userInfo={userInfo} />}
        {step === 'profile' && <ProfileStep userInfo={userInfo} />}
      </div>
      <OnboardingProgress />
      <OnboardingNavigation userInfo={userInfo} />
    </div>
  );
};
