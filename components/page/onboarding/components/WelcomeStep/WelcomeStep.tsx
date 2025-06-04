import React from 'react';

import s from './WelcomeStep.module.scss';
import { IUserInfo } from '@/types/shared.types';
import { useOnboardingState } from '@/services/onboarding/store';

interface Props {
  userInfo: IUserInfo;
}

export const WelcomeStep = ({ userInfo }: Props) => {
  const {
    actions: { setStep },
  } = useOnboardingState();

  return (
    <div className={s.root}>
      <div className={s.title}>
        Hello, <span>{userInfo.name}</span>!
      </div>
      <div className={s.subtitle}>In less than 1 minute, your profile will be ready to view.</div>
      <button className={s.actionButton} onClick={() => setStep('profile')}>
        Let&apos;s go!
      </button>
    </div>
  );
};
