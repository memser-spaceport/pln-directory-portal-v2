'use client';

import React from 'react';
import s from './BackButton.module.scss';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';

export const BackButton = ({
  to,
  className,
  forceTo = false,
}: {
  to: string;
  className?: string;
  forceTo?: boolean;
}) => {
  const router = useRouter();
  return (
    <div className={clsx(s.subheader, className)}>
      <button
        className={s.backBtn}
        onClick={() => {
          if (window.history.length > 1 && !forceTo) {
            router.back();
          } else {
            router.push(to); // fallback route
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
