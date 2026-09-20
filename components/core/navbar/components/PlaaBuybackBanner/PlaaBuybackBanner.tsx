'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Image from 'next/image';

import { usePlaaAccess } from '@/services/rbac/hooks/usePlaaAccess';
import { useAlignmentAssetsAnalytics } from '@/analytics/alignment-assets.analytics';
import {
  formatBuybackAuctionEnd,
  formatBuybackCountdown,
  getBuybackAuctionPhase,
  getBuybackAuctionProgressPct,
  getBuybackDebugNowOverride,
} from '@/utils/plaaBuybackAuction.utils';

import styles from './PlaaBuybackBanner.module.scss';

const AUCTION_START_ISO = '2026-09-22T16:00:00Z'; // 12:00 PM ET
const AUCTION_END_ISO = '2026-09-29T16:00:00Z'; // 12:00 PM ET
const AUCTION_START_MS = Date.parse(AUCTION_START_ISO);
const AUCTION_END_MS = Date.parse(AUCTION_END_ISO);
const AUCTION_URL = 'https://auction-interface.fly.dev/';
const CTA_LABEL = 'Place your Bid Now';

const COUNTDOWN_TICK_MS = 60_000;

const DEBUG_OVERRIDE_ENABLED = process.env.NODE_ENV !== 'production';

export interface BuybackBannerSlide {
  debugNow: number | null;
  progressPct: number;
  countdownLabel: string;
  auctionEndLabel: string;
  onCtaClick: () => void;
}

export function useBuybackBannerSlide(): BuybackBannerSlide | null {
  const searchParams = useSearchParams();
  const debugNow = DEBUG_OVERRIDE_ENABLED
    ? getBuybackDebugNowOverride(searchParams, AUCTION_START_MS, AUCTION_END_MS)
    : null;

  const [tickNow, setTickNow] = useState(() => Date.now());
  const { onBannerButtonClicked } = useAlignmentAssetsAnalytics();

  useEffect(() => {
    if (debugNow !== null) return;
    const id = setInterval(() => setTickNow(Date.now()), COUNTDOWN_TICK_MS);
    return () => clearInterval(id);
  }, [debugNow]);

  const now = debugNow ?? tickNow;
  const phase = getBuybackAuctionPhase(now, AUCTION_START_MS, AUCTION_END_MS);

  if (phase !== 'live') {
    return null;
  }

  return {
    debugNow,
    progressPct: getBuybackAuctionProgressPct(now, AUCTION_START_MS, AUCTION_END_MS),
    countdownLabel: formatBuybackCountdown(now, AUCTION_END_MS),
    auctionEndLabel: formatBuybackAuctionEnd(AUCTION_END_ISO),
    onCtaClick: () => onBannerButtonClicked(CTA_LABEL, AUCTION_URL),
  };
}

export function PlaaBuybackBannerBar({ slide }: { slide: BuybackBannerSlide }) {
  return (
    <div className={styles.bar}>
      {DEBUG_OVERRIDE_ENABLED && slide.debugNow !== null && (
        <span className={styles.debugBadge}>debug: {new Date(slide.debugNow).toISOString()}</span>
      )}

      <span className={styles.title}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="12.5" y="2.5" width="5" height="9" rx="1.2" transform="rotate(45 15 7)" />
            <path d="M9.5 9.5 3.5 15.5" />
            <path d="M3 21h8" />
            <path d="m7.5 12.5 4 4" />
          </g>
        </svg>
        September Buyback Auction
      </span>

      <span className={styles.divider} />

      <span className={styles.countdown}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {slide.countdownLabel}
      </span>

      <span className={styles.progressTrack} aria-hidden="true">
        <span className={styles.progressFill} style={{ width: `${slide.progressPct}%` }} />
      </span>

      <span className={styles.auctionEnd}>Auction Ends {slide.auctionEndLabel}</span>

      <a href={AUCTION_URL} target="_blank" rel="noopener noreferrer" className={styles.cta} onClick={slide.onCtaClick}>
        {CTA_LABEL}
        <Image src="/icons/arrow-right-white.svg" alt="" width={14} height={14} />
      </a>
    </div>
  );
}

export function PlaaBuybackBanner() {
  const pathname = usePathname();
  const { canView } = usePlaaAccess();

  if (!pathname?.includes('alignment-asset') || !canView) {
    return null;
  }

  return <PlaaBuybackBannerGated />;
}

function PlaaBuybackBannerGated() {
  const slide = useBuybackBannerSlide();

  if (!slide) {
    return null;
  }

  return <PlaaBuybackBannerBar slide={slide} />;
}
