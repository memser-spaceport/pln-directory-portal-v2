'use client';

import { PropsWithChildren } from 'react';
import { useRouter } from 'next/navigation';

import { useAuthAnalytics } from '@/analytics/auth.analytics';
import { Button } from '@/components/common/Button';

import s from './SignUpBtn.module.scss';

export const SignUpBtn = (props: PropsWithChildren) => {
  const { children } = props;

  const router = useRouter();
  const authAnalytics = useAuthAnalytics();

  const onSignUpClickHandler = () => {
    authAnalytics.onSignUpBtnClicked();
    const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
    router.push(`/sign-up?returnTo=${returnTo}`);
  };

  return (
    <Button style="border" variant="neutral" className={s.root} onClick={onSignUpClickHandler}>
      {children || 'Create account'}
    </Button>
  );
};
