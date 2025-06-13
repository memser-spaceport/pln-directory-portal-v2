'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { IUserInfo } from '@/types/shared.types';
import { OnboardingWizard } from '@/components/page/onboarding/components/OnboardingWizard';
import { useMember } from '@/services/members/hooks/useMember';

interface Props {
  isLoggedIn: boolean;
  userInfo: IUserInfo;
}

const fade = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

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

  return (
    <AnimatePresence>
      <motion.div className="modal" initial="hidden" animate="visible" exit="exit" variants={fade} transition={{ duration: 0.7 }} style={{ zIndex: 10, position: 'fixed', inset: 0 }}>
        <OnboardingWizard userInfo={userInfo} isLoggedIn={isLoggedIn} memberData={memberData} />
      </motion.div>
    </AnimatePresence>
  );
};
