'use client';

import React from 'react';
import { Button } from '@/components/common/Button';
import s from './SpvSpotlight.module.scss';

type Props = {
  /** Already has an investor profile (Demo Day, a past deal) → review, not set up. */
  existing: boolean;
  onOpen: () => void;
};

/**
 * The investor-profile ask: one sentence on a tinted strip, and the press at its
 * end (review 2026-10-07: "a plain sentence w/ a link vs a sectional tile").
 *
 * Since the UX updates doc (2026-10-09) it sits low on the page, before or
 * after the Q&A (demo bar). 2026-10-12, "highlight it a bit more": the
 * sentence went to primary ink and the inline link became a small brand button
 * at the strip's end. Then "stand out more than Explore": the strip took the
 * brand tint and the button the brand fill, and the Explore tile under it went
 * neutral. Still no icon (an ask is not an alert), and still xs, below the
 * page's green data-room button.
 * The press opens the investor-profile drawer.
 *
 * History: 2026-10-05 a card under the description (alert band, then a plain
 * card with a read-back of check size / stages / focus and a bordered button);
 * 2026-10-07 one centred sentence with an inline link; 2026-10-12 left-aligned.
 */
export function SpvInvestorProfileCard({ existing, onOpen }: Props) {
  return (
    <div className={s.profileAsk}>
      <p className={s.profileAskText}>
        {existing
          ? 'Keep the deals you see filtered to your check size, stage and sector.'
          : // Legal-approved copy (UX updates doc, 2026-10-09): the deals you see
            // are filtered, rather than "we'll only send you" deals.
            'Set your preferences for check size, stage and sector, and we’ll filter the deals you see to match.'}
      </p>
      <Button style="fill" variant="primary" size="xs" className={s.profileAskButton} onClick={onOpen}>
        {existing ? 'Review your investor profile' : 'Set up your investor profile'}
      </Button>
    </div>
  );
}
