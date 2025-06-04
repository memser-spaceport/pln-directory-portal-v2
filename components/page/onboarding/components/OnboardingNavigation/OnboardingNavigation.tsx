import React from 'react';

import s from './OnboardingNavigation.module.scss';
import { OnboardingWizardStep, useOnboardingState } from '@/services/onboarding/store';
import { IUserInfo } from '@/types/shared.types';
import clsx from 'clsx';

interface Props {
  userInfo: IUserInfo;
}

const steps: OnboardingWizardStep[] = ['welcome', 'profile', 'contacts', 'expertise'];

export const OnboardingNavigation = ({ userInfo }: Props) => {
  const {
    step,
    actions: { setStep },
  } = useOnboardingState();

  function renderContent() {
    switch (step) {
      case 'welcome': {
        return (
          <div className={s.inline}>
            <span className={s.label}>Confirmed as</span>
            <span className={clsx(s.label, s.primary)}>{userInfo.email}</span>
            <button className={s.triggerLoginButton}>Change</button>
          </div>
        );
      }
      case 'profile': {
        return (
          <div className={s.withControls}>
            <button
              className={clsx(s.btn, s.secondary)}
              onClick={() => {
                const current = steps.findIndex((item) => item === step);

                setStep(steps[current - 1]);
              }}
            >
              Back
            </button>
            <span className={clsx(s.info)}>These details are needed for login and notifications.</span>
            <button
              className={clsx(s.btn, s.primary)}
              onClick={() => {
                const current = steps.findIndex((item) => item === step);

                setStep(steps[current + 1]);
              }}
            >
              Next
            </button>
          </div>
        );
      }
      default: {
        return null;
      }
    }
  }

  return <div className={s.root}>{renderContent()}</div>;
};
