'use client';

import React from 'react';
import Link from 'next/link';
import s from './PitchComingSoonCard.module.scss';

type Props = {
  teamName: string;
  teamUid: string;
};

const ClosedIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path
      d="M16 4C9.37258 4 4 9.37258 4 16C4 22.6274 9.37258 28 16 28C22.6274 28 28 22.6274 28 16C28 9.37258 22.6274 4 16 4Z"
      stroke="#8897AE"
      strokeWidth="2"
    />
    <path d="M11 11L21 21M21 11L11 21" stroke="#8897AE" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const PitchClosedCard = ({ teamName, teamUid }: Props) => (
  <div className={s.card}>
    <div className={s.icon} aria-hidden>
      <ClosedIcon />
    </div>
    <h2 className={s.title}>Pitch not available</h2>
    <p className={s.description}>
      This pitch is closed and materials are no longer available. You can still learn about <strong>{teamName}</strong>{' '}
      on the Protocol Labs Network.
    </p>
    <div className={s.actions}>
      <Link href={`/teams/${teamUid}`} target="_blank" rel="noopener noreferrer" className={s.secondaryButton}>
        View team profile
      </Link>
    </div>
  </div>
);
