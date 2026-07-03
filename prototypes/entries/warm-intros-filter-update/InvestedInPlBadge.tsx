'use client';

import type { MockInvestor } from './mocks';
import { ProtocolLabsMark } from './ProtocolLabsMark';
import x from './WarmIntrosImprovements.module.scss';

/** Long-form text for tooltips: "Invested in Protocol Labs · Fund II, 2021". */
export function investedInPlText(inv: MockInvestor): string {
  const d = inv.invested_in_pl;
  const detail = d?.vehicle ? ` · ${d.vehicle}${d.year ? `, ${d.year}` : ''}` : d?.year ? ` · ${d.year}` : '';
  return `Invested in Protocol Labs${detail}`;
}

/** "Invested in PL" — this investor backs Protocol Labs itself, the strongest
 *  relationship fact. Icon-only in the table's Relationship cell (the words live
 *  in the tooltip and the drawer); `withLabel` renders the drawer-header pill. */
export function InvestedInPlBadge({ investor, withLabel = false }: { investor: MockInvestor; withLabel?: boolean }) {
  if (!investor.invested_in_pl) return null;
  return (
    <span className={withLabel ? x.plInvestedPill : x.plInvestedBadge} title={investedInPlText(investor)}>
      <ProtocolLabsMark width={12} height={12} />
      {withLabel && <span>Invested in PL</span>}
    </span>
  );
}
