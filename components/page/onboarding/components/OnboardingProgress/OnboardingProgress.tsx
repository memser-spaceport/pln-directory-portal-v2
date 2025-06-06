import React from 'react';
import { Progress } from '@base-ui-components/react/progress';
import { useOnboardingState } from '@/services/onboarding/store';

import s from './OnboardingProgress.module.scss';
import { useFormContext } from 'react-hook-form';
import { OnboardingForm } from '@/components/page/onboarding/components/OnboardingWizard/types';

export const OnboardingProgress = () => {
  const { step } = useOnboardingState();

  const {
    watch,
    formState: { errors },
  } = useFormContext<OnboardingForm>();
  const values = watch();

  function getTitleLabel() {
    switch (step) {
      case 'contacts': {
        return 'Finish';
      }
      default: {
        return 'Progress';
      }
    }
  }

  function getStepLabel() {
    switch (step) {
      case 'contacts': {
        return 2;
      }
      // case 'expertise': {
      //   return 3;
      // }
      default: {
        return 1;
      }
    }
  }

  function getProgressValue() {
    let score = 20;

    if (values.name && !errors.name) {
      score += 20;
    }

    if (values.email && !errors.email) {
      score += 20;
    }

    if (values.officeHours && !errors.officeHours) {
      score += 20;
    }

    if (values.telegram && !errors.telegram) {
      score += 20;
    }

    return score;
  }

  return (
    <div className={s.root}>
      <div className={s.labels}>
        <span className={s.titleLabel}>{getTitleLabel()}</span>
        <span className={s.counter}>
          <span className={s.activeStepLabel}>{getStepLabel()}</span>
          <span className={s.totalStepsLabel}>/2</span>
        </span>
      </div>
      <Progress.Root className={s.progress} value={getProgressValue()}>
        <Progress.Track className={s.track}>
          <Progress.Indicator className={s.indicator} />
        </Progress.Track>
      </Progress.Root>
    </div>
  );
};
