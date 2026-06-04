'use client';

import React from 'react';
import s from './PitchComingSoonCard.module.scss';

type Props = {
  teamName?: string;
};

export const PitchComingSoonCard = ({ teamName }: Props) => (
  <div className={s.card}>
    <div className={s.icon} aria-hidden>
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M16 4C9.37258 4 4 9.37258 4 16C4 22.6274 9.37258 28 16 28C22.6274 28 28 22.6274 28 16C28 9.37258 22.6274 4 16 4Z"
          stroke="#1B4DFF"
          strokeWidth="2"
        />
        <path d="M16 10V16L20 18" stroke="#1B4DFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
    <h2 className={s.title}>Coming soon</h2>
    <p className={s.description}>
      {teamName ? (
        <>
          <strong>{teamName} </strong> has not opened this pitch to investors yet. Check back later — we&apos;ll email
          you when materials are available.
        </>
      ) : (
        <>
          This team pitch is not open to investors yet. Check back later — we&apos;ll email you when materials are
          available.
        </>
      )}
    </p>
  </div>
);
