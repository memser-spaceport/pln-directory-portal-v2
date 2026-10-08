'use client';

import React from 'react';
import s from './SpvInvestorProfileCard.module.scss';

type Props = {
  /** Already has an investor profile (Demo Day, a past deal) → review, not set up. */
  hasProfile: boolean;
  onOpen: () => void;
};

/**
 * The investor-profile ask, as one sentence with a link (design review
 * 2026-10-07: "better as just a plain sentence w/ a link vs a sectional tile").
 * It sits above the team card; as one quiet line it no longer outranks the SPV.
 * The link opens the investor-profile drawer.
 */
export const SpvInvestorProfileCard = ({ hasProfile, onOpen }: Props) => (
  <p className={s.root}>
    {hasProfile ? (
      <>
        <button type="button" className={s.link} onClick={onOpen}>
          Review your investor profile
        </button>{' '}
        to keep the deals we send you matched to your check size, stages and focus.
      </>
    ) : (
      <>
        Tell us how you invest, and we&apos;ll only send you deals that fit your check size, stages and focus.{' '}
        <button type="button" className={s.link} onClick={onOpen}>
          Set up your investor profile
        </button>
      </>
    )}
  </p>
);
