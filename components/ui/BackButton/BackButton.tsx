'use client';

import React from 'react';
import s from './BackButton.module.scss';
import { useRouter, useSearchParams } from 'next/navigation';
import { clsx } from 'clsx';

let navDepth = 0;

if (typeof window !== 'undefined') {
  const originalPushState = history.pushState.bind(history);

  history.pushState = function (...args) {
    navDepth++;
    return originalPushState(...args);
  };

  window.addEventListener('popstate', () => {
    navDepth = Math.max(0, navDepth - 1);
  });
}

export const BackButton = ({
  to,
  className,
  forceTo = false,
  onNavigate,
}: {
  to: string;
  className?: string;
  forceTo?: boolean;
  /** Called before navigation (e.g. analytics). */
  onNavigate?: () => void;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const backTo = searchParams.get('backTo');

  return (
    <div className={clsx(s.subheader, className)}>
      <button
        className={s.backBtn}
        onClick={() => {
          onNavigate?.();
          if (backTo) {
            router.push(backTo);
          } else if (!forceTo && navDepth > 0) {
            router.back();
          } else {
            router.push(to);
          }
        }}
      >
        <BackIcon /> Back
      </button>
    </div>
  );
};

const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 14L5 8L11 2" stroke="#5E718D" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
