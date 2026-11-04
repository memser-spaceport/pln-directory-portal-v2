'use client';

import clsx from 'clsx';
import Link from 'next/link';

import type { IDeal } from '@/types/deals.types';
import { DEAL_ICONS } from '@/components/page/deals/dealsIcons';

import nc from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';
import local from './HomeV2Prototype.module.scss';

/**
 * The headline value of each offer, short enough for a pill. Mocked: the deals
 * API has `shortDescription` only, so a build needs this as a field (or a rule
 * that lifts the first figure out of the description).
 */
const OFFER_VALUE: Record<string, string> = {
  'deal-vercel': '12 mo free',
  'deal-linear': '6 mo free',
  'deal-posthog': '$50K credits',
};

const ArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

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
 * The latest deals as a rail module on the sidebar's white (2026-11-03 redesign;
 * the blue-tinted panel came off the same day at the user's ask). Mobbin
 * refs: Revolut Business's "Trending" rewards rail (logo, name, then the value
 * as the scannable line), SoundCloud's benefits (the offer as a small value
 * pill), Adobe's partner perks (a "Partner perks" kicker over the offer). Each
 * deal is a bordered row with the vendor mark, name, the value
 * pill and the description on one line, the whole row the link. The panel's
 * kicker says why this block looks different from the network lists around it:
 * it's a perk for the reader's team, not news. Deals stay out of the feed on
 * purpose: they're a catalogue, not a dated stream (the feed admission rule).
 */
export function DealsRail({ deals, total }: { deals: IDeal[]; total: number }) {
  return (
    <section className={clsx(nc.card, v0.railCard)} aria-labelledby="home-deals-title">
      <div className={local.dealsHead}>
        <span className={local.dealsKicker}>
          <GiftIcon />
          Portfolio perks
        </span>
        <h2 id="home-deals-title" className={local.dealsTitle}>
          New deals for your team
        </h2>
      </div>

      <ul className={local.dealList}>
        {deals.map((deal) => {
          const Icon = DEAL_ICONS[deal.vendorName.toLowerCase()];
          const value = OFFER_VALUE[deal.uid];
          return (
            <li key={deal.uid}>
              <Link href={`/deals/${deal.uid}`} className={local.dealRow}>
                <span className={local.dealMark} aria-hidden>
                  {deal.logoUrl ? <img src={deal.logoUrl} alt="" /> : Icon ? <Icon /> : deal.vendorName.charAt(0)}
                </span>
                <span className={local.dealText}>
                  <span className={local.dealNameRow}>
                    <span className={local.dealName}>{deal.vendorName}</span>
                    {value && <span className={local.dealValue}>{value}</span>}
                  </span>
                  <span className={local.dealLine}>{deal.shortDescription}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <Link href="/deals" className={local.dealsAll}>
        See all {total} deals
        <ArrowRight />
      </Link>
    </section>
  );
}
