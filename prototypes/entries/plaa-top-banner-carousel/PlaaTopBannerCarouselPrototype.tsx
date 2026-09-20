'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

import { Button } from '@/components/common/Button';
import {
  formatBuybackAuctionEnd,
  formatBuybackCountdown,
  getBuybackAuctionPhase,
  getBuybackAuctionProgressPct,
} from '@/utils/plaaBuybackAuction.utils';

import buybackStyles from '@/components/core/navbar/components/PlaaBuybackBanner/PlaaBuybackBanner.module.scss';
import snapshotStyles from '@/components/core/navbar/components/PlaaSnapshotBar/PlaaSnapshotBar.module.scss';
import carouselStyles from '@/components/core/navbar/components/PlaaTopBannerCarousel/PlaaTopBannerCarousel.module.scss';

const AUCTION_START_ISO = '2026-09-22T16:00:00Z';
const AUCTION_END_ISO = '2026-09-29T16:00:00Z';
const AUCTION_START_MS = Date.parse(AUCTION_START_ISO);
const AUCTION_END_MS = Date.parse(AUCTION_END_ISO);
const AUCTION_URL = 'https://auction-interface.fly.dev/';
const CTA_LABEL = 'Place your Bid Now';

const ROTATE_INTERVAL_MS = 8000;

type PreviewPreset = 'upcoming' | 'live-early' | 'live-ending-soon' | 'ended';

const PREVIEW_PRESETS: Record<PreviewPreset, { label: string; now: number }> = {
  upcoming: { label: 'Upcoming', now: AUCTION_START_MS - 60 * 60 * 1000 },
  'live-early': { label: 'Live · 3 days left', now: AUCTION_END_MS - 3 * 24 * 60 * 60 * 1000 },
  'live-ending-soon': { label: 'Live · 3 hours left', now: AUCTION_END_MS - 3 * 60 * 60 * 1000 },
  ended: { label: 'Ended', now: AUCTION_END_MS + 60 * 60 * 1000 },
};

const SNAPSHOT_STATUS = {
  periodLabel: 'September 2026',
  daysLeft: 12,
  progressPct: 64,
  pointsCollected: 1280,
};

type SlideKey = 'buyback' | 'snapshot';

export default function PlaaTopBannerCarouselPrototype() {
  const [buybackPreset, setBuybackPreset] = useState<PreviewPreset>('live-early');
  const [autoRotate, setAutoRotate] = useState(true);
  const [paused, setPaused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const now = PREVIEW_PRESETS[buybackPreset].now;
  const phase = getBuybackAuctionPhase(now, AUCTION_START_MS, AUCTION_END_MS);
  const progressPct = getBuybackAuctionProgressPct(now, AUCTION_START_MS, AUCTION_END_MS);
  const buybackVisible = phase === 'live';

  const slides: SlideKey[] = buybackVisible ? ['buyback', 'snapshot'] : ['snapshot'];
  const slideCount = slides.length;

  useEffect(() => {
    if (!autoRotate || paused || slideCount < 2) return;
    const id = setInterval(() => setActiveIndex((i) => (i + 1) % slideCount), ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [autoRotate, paused, slideCount]);

  const active = slides[Math.min(activeIndex, slideCount - 1)];

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
          Top banner carousel
        </h1>
        <p
          style={{
            font: '400 14px/20px var(--font-inter, inherit)',
            color: 'var(--foreground-neutral-secondary, #455468)',
            marginBottom: 16,
          }}
        >
          The Buyback Auction banner and the Current Snapshot bar used to stack, doubling the header&apos;s height
          whenever both applied. They now rotate through one slot instead — auto-advancing every 8s, pausable on
          hover, with dots to jump directly. When only one applies (the auction isn&apos;t live), it shows alone with
          no dots. There&apos;s no dismiss control — the carousel already rotates it out of view on its own. Renders
          at 960px and up, same as both bars always did.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          {(Object.keys(PREVIEW_PRESETS) as PreviewPreset[]).map((key) => (
            <Button
              key={key}
              size="s"
              style={buybackPreset === key ? 'fill' : 'border'}
              variant={buybackPreset === key ? 'primary' : 'neutral'}
              onClick={() => setBuybackPreset(key)}
            >
              {PREVIEW_PRESETS[key].label}
            </Button>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <Button
            size="s"
            style={autoRotate ? 'fill' : 'border'}
            variant={autoRotate ? 'primary' : 'neutral'}
            onClick={() => setAutoRotate((r) => !r)}
          >
            Auto-rotate: {autoRotate ? 'on' : 'off'}
          </Button>
          <Button size="s" style="border" variant="neutral" onClick={() => setActiveIndex((i) => (i + 1) % slideCount)}>
            Next slide
          </Button>
          <span
            style={{
              font: '500 13px/20px var(--font-inter, inherit)',
              color: 'var(--foreground-neutral-tertiary, #8897ae)',
            }}
          >
            {slideCount === 1
              ? 'Only one banner applies right now — no dots, no rotation.'
              : `Showing "${active}" · hover the bar below to pause auto-rotation.`}
          </span>
        </div>
      </div>

      <div
        className={carouselStyles.carousel}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div key={active} className={carouselStyles.slide}>
          {active === 'buyback' && (
            <div className={buybackStyles.bar}>
              <span className={buybackStyles.title}>
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

              <span className={buybackStyles.divider} />

              <span className={buybackStyles.countdown}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
                  <path
                    d="M12 7.5V12l3 2"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {formatBuybackCountdown(now, AUCTION_END_MS)}
              </span>

              <span className={buybackStyles.progressTrack} aria-hidden="true">
                <span className={buybackStyles.progressFill} style={{ width: `${progressPct}%` }} />
              </span>

              <span className={buybackStyles.auctionEnd}>Auction Ends {formatBuybackAuctionEnd(AUCTION_END_ISO)}</span>

              <a
                href={AUCTION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={buybackStyles.cta}
                onClick={(e) => e.preventDefault()} // preview only — never navigate away from the click-through
              >
                {CTA_LABEL}
                <Image src="/icons/arrow-right-white.svg" alt="" width={14} height={14} />
              </a>
            </div>
          )}

          {active === 'snapshot' && (
            <div className={snapshotStyles.bar}>
              <span className={snapshotStyles.period}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M4 8h3l2-2h6l2 2h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="13" r="3.2" stroke="currentColor" strokeWidth="1.6" />
                </svg>
                {SNAPSHOT_STATUS.periodLabel} snapshot
              </span>

              <span className={snapshotStyles.divider} />

              <span className={snapshotStyles.daysLeft}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
                  <path
                    d="M12 7.5V12l3 2"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {SNAPSHOT_STATUS.daysLeft} days left to contribute
              </span>

              <span className={snapshotStyles.progressTrack}>
                <span className={snapshotStyles.progressFill} style={{ width: `${SNAPSHOT_STATUS.progressPct}%` }} />
              </span>

              <span className={snapshotStyles.points}>
                <span className={snapshotStyles.pointsValue}>{SNAPSHOT_STATUS.pointsCollected.toLocaleString()}</span>
                <span className={snapshotStyles.pointsLabel}>points collected this snapshot</span>
              </span>

              <button
                className={snapshotStyles.summaryBtn}
                onClick={(e) => e.preventDefault()} // preview only — production opens a modal fed by real backend data
              >
                Snapshot summary
                <Image src="/icons/arrow-right-white.svg" alt="" width={14} height={14} />
              </button>
            </div>
          )}

          {slideCount > 1 && (
            <div className={carouselStyles.dots} role="tablist" aria-label="Banner navigation">
              {slides.map((key, index) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={index === activeIndex}
                  aria-label={`Show ${key === 'buyback' ? 'buyback auction' : 'snapshot'} banner`}
                  className={index === activeIndex ? carouselStyles.dotActive : carouselStyles.dot}
                  onClick={() => setActiveIndex(index)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
