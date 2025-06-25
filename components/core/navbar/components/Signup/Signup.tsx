import React, { useCallback, useState } from 'react';
import { useAuthAnalytics } from '@/analytics/auth.analytics';
import { SignupWizard } from '@/components/page/sign-up/components/SignupWizard';
import { AnimatePresence, motion } from 'framer-motion';

import s from './Signup.module.scss';

const fade = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export const Signup = () => {
  const [open, setOpen] = useState(false);
  const analytics = useAuthAnalytics();

  const handleSignUpClick = () => {
    analytics.onSignUpBtnClicked();
    setOpen(true);
  };

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

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
