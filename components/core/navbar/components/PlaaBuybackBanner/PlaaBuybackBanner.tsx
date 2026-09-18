'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Image from 'next/image';

import { CloseIcon } from '@/components/icons/CloseIcon';
import { usePlaaAccess } from '@/services/rbac/hooks/usePlaaAccess';
import { useAlignmentAssetsAnalytics } from '@/analytics/alignment-assets.analytics';
import {
  dismissBuybackBanner,
  getBuybackBannerDismissed,
  getBuybackBannerDismissedServerSnapshot,
  subscribeBuybackBannerDismissed,
} from '@/utils/plaaBuybackBannerDismissed';
import {
  formatBuybackAuctionEnd,
  formatBuybackCountdown,
  getBuybackAuctionPhase,
  getBuybackAuctionProgressPct,
  getBuybackDebugNowOverride,
} from '@/utils/plaaBuybackAuction.utils';

import styles from './PlaaBuybackBanner.module.scss';

// UTC is the single source of truth for auction timing — never hardcode
// Eastern Time for display. utils/plaaBuybackAuction.utils.ts converts these
// into each bidder's own browser timezone.
const AUCTION_START_ISO = '2026-09-22T16:00:00Z'; // Sep 22, 12:00 PM ET
const AUCTION_END_ISO = '2026-09-29T16:00:00Z'; // Sep 29, 12:00 PM ET
const AUCTION_START_MS = Date.parse(AUCTION_START_ISO);
const AUCTION_END_MS = Date.parse(AUCTION_END_ISO);
const AUCTION_URL = 'https://auction-interface.fly.dev/';
const CTA_LABEL = 'Place your Bid Now';

// Recompute the countdown often enough to move from "N days" to "N hours"
// without a page refresh, without re-rendering every second for copy that
// only ever reads in whole hours or days.
const COUNTDOWN_TICK_MS = 60_000;

// Lets ?debugBuybackNow=<ISO> / ?debugBuybackPhase=upcoming|live|ending-soon|ended
// preview every auction state locally without touching the system clock.
// Never active in production, regardless of what a URL is crafted to say.
const DEBUG_OVERRIDE_ENABLED = process.env.NODE_ENV !== 'production';

/** PLAA members only, mirroring PlaaSnapshotBar's own gating, which this
 *  banner sits directly above (see SiteHeader). Never claims the auction is
 *  open before it starts, and stops rendering once it ends or is dismissed. */
export function PlaaBuybackBanner() {
  const pathname = usePathname();
  const { canView } = usePlaaAccess();

  if (!pathname?.includes('alignment-asset') || !canView) {
    return null;
  }

  return <PlaaBuybackBannerContent />;
}

function PlaaBuybackBannerContent() {
  const searchParams = useSearchParams();
  const debugNow = DEBUG_OVERRIDE_ENABLED
    ? getBuybackDebugNowOverride(searchParams, AUCTION_START_MS, AUCTION_END_MS)
    : null;

  // Real wall-clock time, ticking; ignored below whenever a debug override is
  // active, so the effect never needs to setState the frozen preset itself.
  const [tickNow, setTickNow] = useState(() => Date.now());
  const { onBannerButtonClicked } = useAlignmentAssetsAnalytics();
  const isDismissed = useSyncExternalStore(
    subscribeBuybackBannerDismissed,
    getBuybackBannerDismissed,
    getBuybackBannerDismissedServerSnapshot,
  );

  useEffect(() => {
    // A debug preset should sit still to inspect, not drift — skip the ticker.
    if (debugNow !== null) return;
    const id = setInterval(() => setTickNow(Date.now()), COUNTDOWN_TICK_MS);
    return () => clearInterval(id);
  }, [debugNow]);

  const now = debugNow ?? tickNow;
  const phase = getBuybackAuctionPhase(now, AUCTION_START_MS, AUCTION_END_MS);
  const progressPct = getBuybackAuctionProgressPct(now, AUCTION_START_MS, AUCTION_END_MS);

  if (isDismissed || phase !== 'live') {
    return null;
  }

  return (
    <div className={styles.bar}>
      {DEBUG_OVERRIDE_ENABLED && debugNow !== null && (
        <span className={styles.debugBadge}>debug: {new Date(debugNow).toISOString()}</span>
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
        {formatBuybackCountdown(now, AUCTION_END_MS)}
      </span>

      <span className={styles.progressTrack} aria-hidden="true">
        <span className={styles.progressFill} style={{ width: `${progressPct}%` }} />
      </span>

      <span className={styles.auctionEnd}>Auction Ends {formatBuybackAuctionEnd(AUCTION_END_ISO)}</span>

      <a
        href={AUCTION_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.cta}
        onClick={() => onBannerButtonClicked(CTA_LABEL, AUCTION_URL)}
      >
        {CTA_LABEL}
        <Image src="/icons/arrow-right-white.svg" alt="" width={14} height={14} />
      </a>

      <button
        type="button"
        className={styles.dismissBtn}
        onClick={dismissBuybackBanner}
        aria-label="Dismiss buyback auction banner"
      >
        <CloseIcon />
      </button>
    </div>
  );
}
