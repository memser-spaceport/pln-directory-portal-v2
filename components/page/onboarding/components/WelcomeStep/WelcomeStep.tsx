import React from 'react';

import s from './WelcomeStep.module.scss';
import { IUserInfo } from '@/types/shared.types';
import { useOnboardingState } from '@/services/onboarding/store';
import { motion } from 'framer-motion';

interface Props {
  userInfo: IUserInfo;
  name: string;
}

export const WelcomeStep = ({ userInfo, name }: Props) => {
  const {
    actions: { setStep },
  } = useOnboardingState();

  return (
    <motion.div className={s.root} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className={s.title}>
        Hello, <span>{name ?? userInfo.name}</span>!
      </div>
      <div className={s.subtitle}>In less than 1 minute, your profile will be ready to view.</div>
      <button className={s.actionButton} onClick={() => setStep('profile')}>
        Let&apos;s go!
      </button>
    </motion.div>
  );
};
