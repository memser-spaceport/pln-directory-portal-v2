'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import s from './UpdatesPanel.module.scss';

interface NotLoggedInStateProps {
  onClose: () => void;
}

export function NotLoggedInState({ onClose }: NotLoggedInStateProps) {
  const router = useRouter();

  const handleSignIn = () => {
    onClose();
    router.push(`${window.location.pathname}${window.location.search}#login`);
  };

  const handleSignUp = () => {
    onClose();
    const currentPath = window.location.pathname + window.location.search;
    const returnTo = encodeURIComponent(currentPath);
    router.push(`/sign-up?returnTo=${returnTo}`);
  };

  return (
    <div className={s.notLoggedInState}>
      <img src="/images/empty-nature.svg" alt="" className={s.notLoggedInIllustration} />
      <div className={s.notLoggedInContent}>
        <div className={s.notLoggedInText}>
          <h3 className={s.notLoggedInTitle}>
            Sign in to see
            <br />
            recent updates for you
          </h3>
          <p className={s.notLoggedInDescription}>
            View updates from Demo Days, forum,
            <br />
            and your network activity.
          </p>
        </div>
        <div className={s.notLoggedInButtons}>
          <button className={s.signInButton} onClick={handleSignIn}>
            Sign In to View Updates
          </button>
          <div className={s.signUpRow}>
            <span className={s.signUpText}>Don&apos;t have an account?</span>
            <button className={s.signUpLink} onClick={handleSignUp}>
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

