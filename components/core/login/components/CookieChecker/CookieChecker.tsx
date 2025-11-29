'use client';

import { useEffect, useRef, useState } from 'react';
import Cookies from 'js-cookie';

import { useCommonAnalytics } from '@/analytics/common.analytics';

import s from './CookieChecker.module.scss';

interface CookieCheckerProps {
  isLoggedIn: boolean;
}

const CHECK_INTERVAL = 600000; // 10 minutes

/**
 * CookieChecker - Monitors session expiry
 *
 * Checks every 10 minutes if the user's session has expired
 * and shows a modal prompting them to log in again.
 */
export function CookieChecker({ isLoggedIn }: CookieCheckerProps) {
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(isLoggedIn);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const analytics = useCommonAnalytics();

  const handleClose = () => {
    dialogRef.current?.close();
    window.location.reload();
  };

  const handleLogin = () => {
    analytics.onSessionExpiredLoginClicked();
    window.location.href = `${window.location.pathname}${window.location.search}#login`;
    window.location.reload();
  };

  useEffect(() => {
    setIsUserLoggedIn(isLoggedIn);
  }, [isLoggedIn]);

  useEffect(() => {
    const checkCookieExpiry = () => {
      const cookie = Cookies.get('refreshToken');
      if (isUserLoggedIn && !cookie) {
        dialogRef.current?.showModal();
      }
    };

    checkCookieExpiry();
    const intervalId = setInterval(checkCookieExpiry, CHECK_INTERVAL);

    return () => clearInterval(intervalId);
  }, [isUserLoggedIn]);

  return (
    <dialog onClose={handleClose} ref={dialogRef} className={s.dialog}>
      <div className={s.content}>
        <div className={s.header}>
          <h6 className={s.title}>Session Expired</h6>
          <button onClick={handleClose} className={s.closeButton}>
            <img width={22} height={22} src="/icons/close.svg" alt="close" />
          </button>
        </div>
        <p className={s.text}>Your session has expired due to inactivity. Please login to continue</p>
        <div className={s.actions}>
          <button onClick={handleLogin} className={s.loginButton}>
            Login
          </button>
        </div>
      </div>
    </dialog>
  );
}
