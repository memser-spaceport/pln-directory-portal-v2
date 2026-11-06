'use client';

import clsx from 'clsx';
import Link from 'next/link';

import { useHomeAnalytics } from '@/analytics/home.analytics';
import type { IDeal } from '@/types/deals.types';
import { DEAL_ICONS } from '@/components/page/deals/dealsIcons';
import nc from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';

import { DEALS_HREF } from './constants';
import { ArrowRightIcon } from './icons';
import s from './HomeV2.module.scss';

const GiftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
    <rect x="2" y="6" width="12" height="3" rx="0.8" stroke="currentColor" strokeWidth="1.4" />
    <path d="M3 9v4.2c0 .44.36.8.8.8h8.4c.44 0 .8-.36.8-.8V9M8 6v8" stroke="currentColor" strokeWidth="1.4" />
    <path
      d="M8 6C7.2 4.2 5.6 3 4.9 3.6c-.8.7.4 2.4 3.1 2.4Zm0 0c.8-1.8 2.4-3 3.1-2.4.8.7-.4 2.4-3.1 2.4Z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * The newest deals in the signed-in rail (LAB-3125, prototype `DealsRail`): the "Portfolio perks" kicker over "New
 * deals for your team", a bordered row per deal with the vendor mark, the name, a green value pill when the deal has an
 * offer value (LAB-3071) and the line, the whole row the link, then "See all N deals". Deals stay out of the feed:
 * they're a catalogue, not a dated stream. The caller renders this only for members with deals access.
 */
export function DealsSection({ deals, total }: { deals: IDeal[]; total: number }) {
  const analytics = useHomeAnalytics();

  if (deals.length === 0) return null;

  return (
    <section className={clsx(nc.card, s.railCard)} aria-labelledby="home-deals-title">
      <div className={s.dealsHead}>
        <span className={s.dealsKicker}>
          <GiftIcon />
          Portfolio perks
        </span>
        <h2 id="home-deals-title" className={s.dealsTitle}>
          New deals for your team
        </h2>
      </div>

      <ul className={s.dealList}>
        {deals.map((deal, index) => {
          const Icon = DEAL_ICONS[deal.vendorName.toLowerCase()];
          const value = deal.offerValue?.trim();
          return (
            <li key={deal.uid}>
              <Link
                href={`${DEALS_HREF}/${deal.uid}`}
                className={s.dealRow}
                onClick={() => analytics.onDealClicked({ deal_uid: deal.uid, position: index + 1 })}
              >
                <span className={s.dealMark} aria-hidden>
                  {deal.logoUrl ? <img src={deal.logoUrl} alt="" /> : Icon ? <Icon /> : deal.vendorName.charAt(0)}
                </span>
                <span className={s.dealText}>
                  <span className={s.dealNameRow}>
                    <span className={s.dealName} title={deal.vendorName}>
                      {deal.vendorName}
                    </span>
                    {value && <span className={s.dealValue}>{value}</span>}
                  </span>
                  <span className={s.dealLine}>{deal.shortDescription}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <Link href={DEALS_HREF} className={s.dealsAll} onClick={() => analytics.onSeeAllClicked({ section: 'deals' })}>
        See all {total} deals
        <ArrowRightIcon />
      </Link>
    </section>
  );
}
