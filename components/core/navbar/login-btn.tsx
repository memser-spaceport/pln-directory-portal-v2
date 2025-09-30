'use client';

import { useAuthAnalytics } from '@/analytics/auth.analytics';
import { TOAST_MESSAGES } from '@/utils/constants';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/core/ToastContainer';

import s from './LoginButton.module.scss';
import { PropsWithChildren } from 'react';

interface Props {
  className?: string;
}

const LoginBtn = (props: PropsWithChildren<Props>) => {
  const { className, children } = props;

  const authAnalytics = useAuthAnalytics();
  const router = useRouter();

  const onLoginClickHandler = () => {
    authAnalytics.onLoginBtnClicked();
    const userInfo = Cookies.get('userInfo');
    if (userInfo) {
      toast.info(TOAST_MESSAGES.LOGGED_IN_MSG);
      router.refresh();
    } else {
      if (window.location.pathname === '/sign-up') {
        router.push(`/#login`);
      } else {
        router.push(`${window.location.pathname}${window.location.search}#login`);
      }
    }
  };

  return (
    <>
      <button className={className || s.root} onClick={onLoginClickHandler}>
        {children || 'Sign in'}
      </button>
    </>
  );
};

export default LoginBtn;
