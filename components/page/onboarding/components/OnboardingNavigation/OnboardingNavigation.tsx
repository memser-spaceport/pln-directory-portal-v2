import React from 'react';

import s from './OnboardingNavigation.module.scss';
import { OnboardingWizardStep, useOnboardingState } from '@/services/onboarding/store';
import { IUserInfo } from '@/types/shared.types';
import clsx from 'clsx';
import { useFormContext } from 'react-hook-form';
import { OnboardingForm } from '@/components/page/onboarding/components/OnboardingWizard/types';

interface Props {
  userInfo: IUserInfo;
}

const steps: OnboardingWizardStep[] = ['welcome', 'profile', 'contacts', 'expertise'];

export const OnboardingNavigation = ({ userInfo }: Props) => {
  const {
    step,
    actions: { setStep },
  } = useOnboardingState();

  const handlePrevClick = () => {
    const current = steps.findIndex((item) => item === step);

    setStep(steps[current - 1]);
  };

  const handleNextClick = () => {
    const current = steps.findIndex((item) => item === step);

    setStep(steps[current + 1]);
  };

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
            <button className={clsx(s.btn, s.secondary)} onClick={handlePrevClick} type="button">
              Back
            </button>
            <span className={clsx(s.info)}>These details are needed for login and notifications.</span>
            <button className={clsx(s.btn, s.primary)} onClick={handleNextClick} type="button">
              Next
            </button>
          </div>
        );
      }
      case 'contacts': {
        return (
          <div className={s.withControls}>
            <button className={clsx(s.btn, s.secondary)} onClick={handlePrevClick} type="button">
              Back
            </button>
            <span className={clsx(s.info)}>Office Hours are times when you&apos;re available to connect with others in the network.</span>
            <button className={clsx(s.btn, s.primary)} onClick={handleNextClick} type="button">
              Next
            </button>
          </div>
        );
      }
      case 'expertise': {
        return (
          <div className={s.withControls}>
            <button className={clsx(s.btn, s.secondary)} onClick={handlePrevClick} type="button">
              Back
            </button>
            <span className={clsx(s.info)}>You can change them anytime.</span>
            <button className={clsx(s.btn, s.primary)} type="submit">
              Finish
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
