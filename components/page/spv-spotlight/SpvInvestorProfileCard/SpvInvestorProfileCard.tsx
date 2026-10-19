'use client';

import React from 'react';
import s from './SpvInvestorProfileCard.module.scss';

type Props = {
  /** Already has an investor profile (Demo Day, a past deal) → review, not set up. */
  hasProfile: boolean;
  onOpen: () => void;
};

/** Grey card: one sentence and an inline link. */
export const SpvInvestorProfileCard = ({ hasProfile, onOpen }: Props) => (
  <p className={s.root}>
    {"Set your preferences for check size, stage and sector, and we'll filter the deals you see to match. "}
    <button type="button" className={s.link} onClick={onOpen}>
      {hasProfile ? 'Review your investor profile' : 'Set up your investor profile'}
    </button>
  </p>
);
