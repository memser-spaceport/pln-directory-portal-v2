'use client';

import { useState } from 'react';
import Image from 'next/image';

import { Button } from '@/components/common/Button';
import { CloseIcon } from '@/components/icons/CloseIcon';
import {
  formatBuybackAuctionEnd,
  formatBuybackCountdown,
  getBuybackAuctionPhase,
  getBuybackAuctionProgressPct,
} from '@/utils/plaaBuybackAuction.utils';

// The shipped stylesheet, imported directly — not copied — so this preview can
// only drift on the JSX shell below, never on spacing, color, or breakpoints.
import styles from '@/components/core/navbar/components/PlaaBuybackBanner/PlaaBuybackBanner.module.scss';

const AUCTION_START_ISO = '2026-09-22T16:00:00Z';
const AUCTION_END_ISO = '2026-09-29T16:00:00Z';
const AUCTION_START_MS = Date.parse(AUCTION_START_ISO);
const AUCTION_END_MS = Date.parse(AUCTION_END_ISO);
const AUCTION_URL = 'https://auction-interface.fly.dev/';
const CTA_LABEL = 'Place your Bid Now';

type PreviewPreset = 'upcoming' | 'live-early' | 'live-ending-soon' | 'ended';

const PREVIEW_PRESETS: Record<PreviewPreset, { label: string; now: number }> = {
  upcoming: { label: 'Upcoming', now: AUCTION_START_MS - 60 * 60 * 1000 },
  'live-early': { label: 'Live · 3 days left', now: AUCTION_END_MS - 3 * 24 * 60 * 60 * 1000 },
  'live-ending-soon': { label: 'Live · 3 hours left', now: AUCTION_END_MS - 3 * 60 * 60 * 1000 },
  ended: { label: 'Ended', now: AUCTION_END_MS + 60 * 60 * 1000 },
};

/**
 * Click-through preview of components/core/navbar/components/PlaaBuybackBanner
 * — the real September Buyback Auction banner. Production only ever renders it
 * on /alignment-asset behind PLAA RBAC access (usePlaaAccess) and only during
 * the live auction window, so seeing every state needs a signed-in PLAA member
 * and a system clock inside a ~1 week window. Neither is available here.
 *
 * The stylesheet, CloseIcon, and every number shown (formatBuybackCountdown,
 * formatBuybackAuctionEnd, getBuybackAuctionPhase) are imported straight from
 * production, not re-typed — this can only drift on the JSX shell below, never
 * on the CSS or the countdown/date logic. The shell itself is transcribed from
 * PlaaBuybackBanner.tsx's presentational half (everything after its two gate
 * checks), because that file's only export is the gated wrapper and prototypes
 * must not import production files that require modification to expose an
 * ungated piece. If the banner's markup changes, re-copy it here.
 *
 * The banner is styled as a direct sibling of PlaaSnapshotBar — same
 * background, row height, icon sizes, divider and CTA-button treatment — and
 * inherits that component's own responsive behavior: desktop/tablet-landscape
 * only (≥960px), hidden below it, same as the reference. Narrow the preview
 * window past 960px to see it disappear the same way PlaaSnapshotBar does.
 */
export default function PlaaBuybackBannerPrototype() {
  const [preset, setPreset] = useState<PreviewPreset>('live-early');
  const [dismissed, setDismissed] = useState(false);
  const now = PREVIEW_PRESETS[preset].now;
  const phase = getBuybackAuctionPhase(now, AUCTION_START_MS, AUCTION_END_MS);
  const progressPct = getBuybackAuctionProgressPct(now, AUCTION_START_MS, AUCTION_END_MS);

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      <div style={{ padding: '24px 20px 16px', maxWidth: 900, margin: '0 auto' }}>
        <h1
          style={{
            font: '600 20px/28px var(--font-inter, inherit)',
            color: 'var(--foreground-neutral-primary, #0a0c11)',
            marginBottom: 6,
          }}
        >
          September Buyback Auction banner
        </h1>
        <p
          style={{
            font: '400 14px/20px var(--font-inter, inherit)',
            color: 'var(--foreground-neutral-secondary, #455468)',
            marginBottom: 16,
          }}
        >
          Real component, mocked clock. Switch phases below. Like PlaaSnapshotBar, this banner only renders at
          960px and up — narrow the window to see it disappear the same way that one does.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {(Object.keys(PREVIEW_PRESETS) as PreviewPreset[]).map((key) => (
            <Button
              key={key}
              size="s"
              style={preset === key ? 'fill' : 'border'}
              variant={preset === key ? 'primary' : 'neutral'}
              onClick={() => {
                setPreset(key);
                setDismissed(false);
              }}
            >
              {PREVIEW_PRESETS[key].label}
            </Button>
          ))}
          <Button
            size="s"
            style={dismissed ? 'fill' : 'border'}
            variant={dismissed ? 'primary' : 'neutral'}
            onClick={() => setDismissed((d) => !d)}
          >
            Dismissed
          </Button>
        </div>
      </div>

      {!dismissed && phase === 'live' && (
        <div className={styles.bar}>
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
            onClick={(e) => e.preventDefault()} // preview only — never navigate away from the click-through
          >
            {CTA_LABEL}
            <Image src="/icons/arrow-right-white.svg" alt="" width={14} height={14} />
          </a>

          <button
            type="button"
            className={styles.dismissBtn}
            onClick={() => setDismissed(true)}
            aria-label="Dismiss buyback auction banner"
          >
            <CloseIcon />
          </button>
        </div>
      )}

      {!dismissed && phase !== 'live' && (
        <p
          style={{
            padding: '16px 20px',
            font: '500 13px/20px var(--font-inter, inherit)',
            color: 'var(--foreground-neutral-tertiary, #8897ae)',
          }}
        >
          The banner renders nothing in the &quot;{phase}&quot; phase — correct: production never shows it before the
          auction opens or after it closes.
        </p>
      )}

      {/* Mock strip only — not the real PlaaSnapshotBar, which needs its own live PLAA
          session and backend data. Shown purely so the "sits directly above" stacking is
          visible, and deliberately styled to look like the same component: the two should
          read as siblings, not as two different banner designs. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          padding: '11px 24px',
          background: '#1b4dff',
          color: '#fff',
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        September 2026 snapshot (mock Current Snapshot banner, for layout context only)
      </div>
    </div>
  );
}
