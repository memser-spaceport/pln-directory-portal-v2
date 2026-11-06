import clsx from 'clsx';

import { PL_FACTS } from '@/components/page/explore-pl-network/data/content';
import ei from '@/components/page/explore-pl-network/EditorialIntro/EditorialIntro.module.scss';

import { FACT_LABEL } from './constants';
import s from './HomeV2.module.scss';

/** The figures as a full-bleed white band (the mock's second strip): EditorialIntro's PL_FACTS, left-aligned, hairline-divided. */
export function FactsBand({ portfolioCount, className }: { portfolioCount: number; className?: string }) {
  return (
    <div className={clsx(s.factsBand, className)}>
      <dl className={s.facts}>
        {PL_FACTS.map((f) => (
          <div key={f.label} className={s.fact}>
            <dd className={s.factValue}>{f.value === 'portfolio' ? portfolioCount : f.value}</dd>
            <dt className={ei.edFactLabel}>{FACT_LABEL[f.label] ?? f.label}</dt>
          </div>
        ))}
      </dl>
    </div>
  );
}
