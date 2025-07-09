import React, { useCallback, useEffect, useState } from 'react';
import { useAuthAnalytics } from '@/analytics/auth.analytics';
import { SignupWizard } from '@/components/page/sign-up/components/SignupWizard';
import { AnimatePresence, motion } from 'framer-motion';

import s from './Signup.module.scss';
import { useRouter, useSearchParams } from 'next/navigation';

const fade = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export const Signup = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const analytics = useAuthAnalytics();
  const searchParams = useSearchParams();

  const handleSignUpClick = () => {
    analytics.onSignUpBtnClicked();
    router.replace('/sign-up');
  };

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (searchParams.get('dialog') === 'signup' && !open) {
      setOpen(true);
      const params = new URLSearchParams(searchParams.toString());

      params.delete('dialog');

      router.replace(`?${params.toString()}`);
    }
  }, [open, router, searchParams]);

  return (
    <>
      <button className={s.root} onClick={handleSignUpClick}>
        Sign up
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="modal" initial="hidden" animate="visible" exit="exit" variants={fade} transition={{ duration: 0.5 }} style={{ zIndex: 10, position: 'absolute' }}>
            <SignupWizard onClose={handleClose} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
