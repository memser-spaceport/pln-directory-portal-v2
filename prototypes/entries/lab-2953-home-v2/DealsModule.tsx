'use client';

import clsx from 'clsx';
import Link from 'next/link';

import type { HomeDeal } from './mocks';
import s from './HomeV2Prototype.module.scss';

/**
 * Deals on Home (Polina, 2026-10-28: "deals, currently underused/hidden").
 * A compact version of production's DealCard (components/page/deals/DealCard):
 * the same avatar letter, vendor name, short description, category / audience
 * tags and "N using" line, in a row instead of a 64px-avatar card, so three
 * deals fit in one band. Simplified: no tracking hook, no deal-label constants,
 * no vendor icons; the link goes to the Deals page.
 */
export function DealsModule({ deals }: { deals: HomeDeal[] }) {
  return (
    <ul className={s.dealList}>
      {deals.map((deal) => (
        <li key={deal.uid}>
          <Link href="/deals" className={s.dealRow}>
            <span className={s.dealAvatar} aria-hidden>
              {deal.vendorName.charAt(0)}
            </span>
            <span className={s.dealText}>
              <span className={s.dealName}>
                {deal.vendorName}
                {deal.isHighValue && (
                  <span className={clsx(s.dealTag, s.dealTagHigh)} aria-label="High value deal">
                    High value
                  </span>
                )}
              </span>
              <span className={s.dealDesc}>{deal.shortDescription}</span>
              <span className={s.dealMeta}>
                <span className={s.dealTag}>{deal.category}</span>
                <span className={s.dealTag}>{deal.audience}</span>
                <span>{deal.teamsUsingCount} teams use it</span>
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
