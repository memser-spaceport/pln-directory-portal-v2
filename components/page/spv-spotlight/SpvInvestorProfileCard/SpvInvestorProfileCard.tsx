'use client';

import React from 'react';
import { Button } from '@/components/common/Button';
import s from './SpvInvestorProfileCard.module.scss';

type Props = {
  /** Already has an investor profile (Demo Day, a past deal) → review, not set up. */
  hasProfile: boolean;
  onOpen: () => void;
};

/**
 * The investor-profile door, in a card of its own under the Spotlight's
 * description (review 2026-10-05): the profile is about the deals we send next,
 * not this team, so it stays out of the team card's action slot. A plain page
 * card, no icon, no read-back of the profile. The button is the DS blue outline,
 * so the team card's Request data room access stays the page's one filled primary.
 */
export const SpvInvestorProfileCard = ({ hasProfile, onOpen }: Props) => (
  <section className={s.root} aria-labelledby="spv-profile-card-title">
    <div className={s.head}>
      <span className={s.overline}>For future deals</span>
      <h2 id="spv-profile-card-title" className={s.title}>
        Get only the deals that fit you
      </h2>
      <p className={s.body}>
        Set your check size, stages and focus once — we use it for every future deal we send you.
      </p>
    </div>

    <div className={s.cta}>
      <Button size="m" style="border" variant="primary" type="button" className={s.button} onClick={onOpen}>
        {hasProfile ? 'Review and update' : 'Set up investor profile'}
      </Button>
      <span className={s.hint}>Takes about 1 min</span>
    </div>
  </section>
);
