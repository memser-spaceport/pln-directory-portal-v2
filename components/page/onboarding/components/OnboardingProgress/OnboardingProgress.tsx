import React from 'react';
import { Progress } from '@base-ui-components/react/progress';
import { useOnboardingState } from '@/services/onboarding/store';

import s from './OnboardingProgress.module.scss';

export const OnboardingProgress = () => {
  const { step } = useOnboardingState();

  function getTitleLabel() {
    switch (step) {
      case 'welcome': {
        return `Should take less than 1 minute. Let's go!`;
      }
      case 'expertise': {
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
      case 'expertise': {
        return 3;
      }
      default: {
        return 1;
      }
    }
  }

  function getProgressValue() {
    switch (step) {
      case 'welcome': {
        return 20;
      }
      case 'profile': {
        return 40;
      }
      case 'contacts': {
        return 70;
      }
      case 'expertise': {
        return 90;
      }
      default: {
        return 20;
      }
    }
  }

  return (
    <div className={s.root}>
      <div className={s.labels}>
        <span className={s.titleLabel}>{getTitleLabel()}</span>
        <span className={s.counter}>
          <span className={s.activeStepLabel}>{getStepLabel()}</span>
          <span className={s.totalStepsLabel}>/3</span>
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
