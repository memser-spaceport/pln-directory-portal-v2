'use client';

import React from 'react';
import s from './BackButton.module.scss';
import { useRouter } from 'next/navigation';

export const BackButton = ({ to }: { to: string }) => {
  const router = useRouter();
  return (
    <div className={s.subheader}>
      <button className={s.backBtn} onClick={() => router.push(to)}>
        <BackIcon /> Back
      </button>
    </div>
  );
};

const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 14L5 8L11 2" stroke="#5E718D" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
);
