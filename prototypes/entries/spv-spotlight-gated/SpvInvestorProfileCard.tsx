'use client';

import React from 'react';
import s from './SpvSpotlight.module.scss';

type Props = {
  /** Already has an investor profile (Demo Day, a past deal) → review, not set up. */
  existing: boolean;
  onOpen: () => void;
};

/**
 * The investor-profile ask, as one sentence with a link (review 2026-10-07).
 *
 * Anuj: "better as just a plain sentence w/ a link vs a sectional tile".
 * It sits above the team card: tried after it (Charlotte's hierarchy question)
 * and moved back the same day. As one quiet line it no longer outranks the
 * SPV, which was the worry about the card. The link opens the
 * investor-profile drawer.
 *
 * History: 2026-10-05 a card under the description (alert band, then a plain
 * card with a read-back of check size / stages / focus and a bordered button).
 * The card is gone, so this is the whole ask.
 */
export function SpvInvestorProfileCard({ existing, onOpen }: Props) {
  return (
    <p className={s.profileAsk}>
      {existing ? (
        <>
          <button type="button" className={s.inlineLink} onClick={onOpen}>
            Review your investor profile
          </button>{' '}
          to keep the deals we send you matched to your check size, stages and focus.
        </>
      ) : (
        <>
          {/* Copy from the user, 2026-10-08: the sentence is the reason, the
              link keeps its own label after it. */}
          Tell us how you invest, and we&apos;ll only send you deals that fit your check size, stage and focus.{' '}
          <button type="button" className={s.inlineLink} onClick={onOpen}>
            Set up your investor profile
          </button>
        </>
      )}
    </p>
  );
}
