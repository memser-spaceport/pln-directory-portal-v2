import React from 'react';
import s from './SpvDealCard.module.scss';

const MARK_SRC = '/images/spv-spotlight/plc-neurotech-mark.png';

type Term = { label: string; value: string };

type Props = {
  fundName: string | null;
  terms: Term[];
  action?: React.ReactNode;
};

/** The vehicle, above the team card: name, the set terms, and the data-room door. */
export function SpvDealCard({ fundName, terms, action }: Props) {
  const title = fundName?.trim() || null;

  return (
    <section className={s.card} aria-label="SPV details">
      <div className={s.head}>
        <div className={s.identity}>
          <span className={s.mark}>
            <img src={MARK_SRC} alt="" />
          </span>
          <div className={s.titleBlock}>
            <span className={s.overline}>SPV</span>
            {title && <h2 className={s.title}>{title}</h2>}
          </div>
        </div>
        {action && <div className={s.action}>{action}</div>}
      </div>
      {terms.length > 0 && (
        <dl className={s.terms}>
          {terms.map((term) => (
            <div key={term.label} className={s.term}>
              <dt className={s.label}>{term.label}</dt>
              <dd className={s.value}>{term.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
