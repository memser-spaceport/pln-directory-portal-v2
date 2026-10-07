'use client';

import React from 'react';
import { Button } from '@/components/common/Button';
import { formatUSD } from '@/utils/formatUSD';
import type { InvestorRecord } from './SpvInvestorProfileDrawer';
import s from './SpvSpotlight.module.scss';

type Props = {
  /** Already has an investor profile (Demo Day, a past deal) → review, not set up. */
  existing: boolean;
  /** What the preview row reads back: check size, stages, focus. */
  investor: InvestorRecord;
  onOpen: () => void;
};

/**
 * The investor-profile door, in a card of its own under the Spotlight's
 * description (review 2026-10-05): the profile is about the deals we send
 * next, not about this team, so it doesn't share the team card's action slot,
 * and why it is worth doing is on the card at rest.
 *
 * Second pass the same day: the first version wore the job board's alert band
 * (JobAlertShell: brand tint, brand border, brand title and body, an info "i"),
 * which read as a system notice with nothing leading. Now it is a plain page
 * card like its neighbours (white, the DS card border, 8px — the team card's
 * and the Explore tile's radius): an overline, a primary-ink title, a
 * secondary-ink sentence, and a read-back of the three things the profile
 * holds, so the benefit is concrete and the space beside the button is used.
 * No icon (removed 2026-10-06): the tile was the alert's "i" in new paint, and
 * the overline + title already say what the card is. The button is the
 * DS blue outline (border + primary), chosen 2026-10-06 over bordered neutral
 * (read as a Cancel) and fill + light. The team card's Request data room access
 * stays the page's one filled primary.
 *
 * The read-back items each open the drawer, and the whole cell, label and
 * value, is the button (2026-10-06: the label alone wasn't clickable and there
 * was no hover, so nothing said the cells were doors). Soft fill on hover,
 * focus ring on keyboard.
 *
 * Hidden 2026-10-06 (SHOW_READBACK): three "Not set" cells added weight, not
 * information; the sentence already names check size, stages and focus.
 */
const SHOW_READBACK = false;

export function SpvInvestorProfileCard({ existing, investor, onOpen }: Props) {
  const fields = [
    {
      label: 'Check size',
      value: investor.angel && investor.checkSize ? formatUSD.format(+investor.checkSize) : '',
    },
    { label: 'Stages', value: investor.angel ? investor.stages.join(', ') : '' },
    { label: 'Focus', value: investor.angel ? investor.focus.join(', ') : '' },
  ];

  return (
    <section className={s.profileCard} aria-labelledby="spv-profile-card-title">
      <div className={s.profileCardHead}>
        <span className={s.exploreTileOverline}>For future deals</span>
        <h2 id="spv-profile-card-title" className={s.profileCardTitle}>
          Get only the deals that fit you
        </h2>
        <p className={s.profileCardBody}>
          Set your check size, stages and focus once — we use it for every future deal we send you.
        </p>
      </div>

      {SHOW_READBACK && (
        <div className={s.profileCardFields}>
          {fields.map((f) => (
            <button
              key={f.label}
              type="button"
              className={s.profileCardField}
              onClick={onOpen}
              aria-label={`${f.label}: ${f.value || 'not set'}. Edit in your investor profile`}
            >
              <span className={s.profileCardFieldLabel}>{f.label}</span>
              <span className={s.profileCardFieldValue}>
                {f.value ? f.value : <span className={s.profileCardNotSet}>Not set</span>}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className={s.profileCardCta}>
        <Button
          size="m"
          style="border"
          variant="primary"
          type="button"
          className={s.profileCardButton}
          onClick={onOpen}
        >
          {existing ? 'Review and update' : 'Set up investor profile'}
        </Button>
        <span className={s.profileCardHint}>Takes about 1 min</span>
      </div>
    </section>
  );
}
