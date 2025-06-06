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

const steps: OnboardingWizardStep[] = ['welcome', 'profile', 'contacts'];

export const OnboardingNavigation = ({ userInfo }: Props) => {
  const {
    step,
    actions: { setStep },
  } = useOnboardingState();

  const {
    formState: { errors, isSubmitting },
  } = useFormContext<OnboardingForm>();

  const handlePrevClick = () => {
    const current = steps.findIndex((item) => item === step);

    setStep(steps[current - 1]);
  };

  const handleNextClick = async () => {
    const current = steps.findIndex((item) => item === step);

    setStep(steps[current + 1]);
  };

  function renderContent() {
    switch (step) {
      case 'welcome': {
        return (
          <div className={s.inline}>
            <span className={s.info}>Should take less than 1 minute. Let&apos;s go!</span>
          </div>
        );
      }
      case 'profile': {
        return (
          <div className={s.withControls} key="profile">
            <button className={clsx(s.btn, s.secondary)} onClick={handlePrevClick} type="button">
              Back
            </button>
            <span className={clsx(s.info)}>These details are needed for login and notifications.</span>
            <button className={clsx(s.btn, s.primary)} onClick={handleNextClick} type="button" disabled={!!errors.name || !!errors.email}>
              Next
            </button>
          </div>
        );
      }
      case 'contacts': {
        return (
          <div className={s.withControls} key="contacts">
            <button className={clsx(s.btn, s.secondary)} onClick={handlePrevClick} type="button">
              Back
            </button>
            <span className={clsx(s.info)}>Office Hours are times when you&apos;re available to connect with others in the network.</span>
            <button className={clsx(s.btn, s.primary)} type="submit" disabled={!!errors.officeHours || !!errors.telegram || isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Finish'}
            </button>
          </div>
        );
      }
      // case 'expertise': {
      //   return (
      //     <div className={s.withControls}>
      //       <button className={clsx(s.btn, s.secondary)} onClick={handlePrevClick} type="button">
      //         Back
      //       </button>
      //       <span className={clsx(s.info)}>You can change them anytime.</span>
      //       <button className={clsx(s.btn, s.primary)} type="submit">
      //         Finish
      //       </button>
      //     </div>
      //   );
      // }
      default: {
        return null;
      }
    }
  }

  return <div className={s.root}>{renderContent()}</div>;
};
