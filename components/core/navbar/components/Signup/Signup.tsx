import React from 'react';

import { PAGE_ROUTES } from '@/utils/constants';
import { useAuthAnalytics } from '@/analytics/auth.analytics';

import s from './Signup.module.scss';

export const Signup = () => {
  const analytics = useAuthAnalytics();

  const handleSignUpClick = () => {
    analytics.onSignUpBtnClicked();
    window.location.href = PAGE_ROUTES.SIGNUP;
  };

  return (
    <button className={s.root} onClick={handleSignUpClick}>
      Sign up
    </button>
  );
};
