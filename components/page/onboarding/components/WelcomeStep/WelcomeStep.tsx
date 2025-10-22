import React from 'react';

import s from './WelcomeStep.module.scss';
import { IUserInfo } from '@/types/shared.types';
import { useOnboardingState } from '@/services/onboarding/store';
import { motion } from 'framer-motion';
import { useMemberAnalytics } from '@/analytics/members.analytics';

interface Props {
  userInfo: IUserInfo;
  name: string;
}

export const WelcomeStep = ({ userInfo, name }: Props) => {
  const {
    actions: { setStep },
  } = useOnboardingState();

  const { onOnboardingWizardStartClicked } = useMemberAnalytics();

  return (
    <motion.div className={s.root} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className={s.title}>
        Hello, <span>{name ?? userInfo.name}</span>!
      </div>
      <div className={s.subtitle}>In less than 1 minute, your profile will be ready to view.</div>
      <button
        className={s.actionButton}
        onClick={() => {
          onOnboardingWizardStartClicked();
          setStep('profile');
        }}
      >
        Let&apos;s go!
      </button>
    </motion.div>
  );
};
