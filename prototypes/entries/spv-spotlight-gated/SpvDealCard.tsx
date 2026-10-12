'use client';

import React from 'react';
import clsx from 'clsx';
import type { SpvDetail } from './mocks';
// The cube-and-brain mark, cropped from the PLC Neurotech logo in the UX doc.
import plcNeurotechMark from './plc-neurotech-mark.png';
import s from './SpvSpotlight.module.scss';

type Props = {
  // The SPV's legal name, as the card's title (the first of the five fields).
  fundName: string;
  // The other four terms, in one strip under the name.
  details: SpvDetail[];
  // The data-room door (SpvCardAction) or the line that holds its slot
  // (SpvCardStatus), built by the page, which knows the viewer's state.
  action?: React.ReactNode;
};

/**
 * The SPV itself, as a thin card right under the hero (Charlotte, call on
 * 2026-10-12): an investor first wants to know what the vehicle is (its name,
 * size, minimum, fees), then who it invests in. So the deal and the team are
 * two cards, deal first, and the data-room button lives here, on the thing the
 * data room belongs to. The team card under it carries no SPV terms.
 *
 * Kept to "the first section of the card": the name and the button on one
 * row, four terms in a strip under it. Five fields only, the ones the UX
 * updates doc marks in bold; the rest of its list (investment, carry,
 * eligibility, liquidity) are in the offering documents and the legal footer.
 */
export function SpvDealCard({ fundName, details, action }: Props) {
  return (
    <section className={s.dealCard} aria-label="SPV details">
      <div className={s.dealHead}>
        <div className={s.dealIdentity}>
          {/* The SPV's own mark: PLC Neurotech's, the fund it sits under
              (2026-10-12, "add any icon/imagery"), in the team card's logo
              tile so the two cards' headers read alike. */}
          <span className={s.dealMark}>
            <img src={plcNeurotechMark.src} alt="" />
          </span>
          <div className={s.dealTitleBlock}>
            <span className={s.dealOverline}>SPV</span>
            <h2 className={s.dealTitle}>{fundName}</h2>
          </div>
        </div>
        {action && <div className={s.dealAction}>{action}</div>}
      </div>
      <dl className={s.dealTerms}>
        {details.map((d) => (
          <div key={d.label} className={s.dealTerm}>
            <dt className={s.factLabel}>{d.label}</dt>
            <dd className={clsx(s.dealTermValue, !d.value && s.dealTermPending)}>{d.value ?? 'To be confirmed'}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
