'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

import { useCurrentSnapshotStatus, CurrentSnapshotStatus } from '@/services/plaa/hooks/useCurrentSnapshotStatus';
import { usePlaaAccess } from '@/services/rbac/hooks/usePlaaAccess';
import { PlaaSnapshotSummaryModal } from './PlaaSnapshotSummaryModal';

import styles from './PlaaSnapshotBar.module.scss';

/** Presentational half of the bar — takes the already-fetched snapshot status
 *  and renders it, plus the summary modal it opens. Reused directly by
 *  PlaaTopBannerCarousel as one of its rotating slides. */
export function PlaaSnapshotBarBar({ status }: { status: CurrentSnapshotStatus }) {
  const [summaryOpen, setSummaryOpen] = useState(false);
  const { periodLabel, daysLeft, progressPct, pointsCollected } = status;

  return (
    <div className={styles.bar}>
      <span className={styles.period}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 8h3l2-2h6l2 2h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="13" r="3.2" stroke="currentColor" strokeWidth="1.6" />
        </svg>
        {periodLabel} snapshot
      </span>

      <span className={styles.divider} />

      <span className={styles.daysLeft}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left to contribute
      </span>

      <span className={styles.progressTrack}>
        <span className={styles.progressFill} style={{ width: `${progressPct}%` }} />
      </span>

      <span className={styles.points}>
        <span className={styles.pointsValue}>{pointsCollected.toLocaleString()}</span>
        <span className={styles.pointsLabel}>points collected this snapshot</span>
      </span>

      <button className={styles.summaryBtn} onClick={() => setSummaryOpen(true)}>
        Snapshot summary
        <Image src="/icons/arrow-right-white.svg" alt="" width={14} height={14} />
      </button>

      <PlaaSnapshotSummaryModal isOpen={summaryOpen} onClose={() => setSummaryOpen(false)} />
    </div>
  );
}

/** PLAA members only: guests and members without PLAA access see nothing, including while access loads. */
export function PlaaSnapshotBar() {
  const pathname = usePathname();
  const { canView } = usePlaaAccess();

  if (!pathname?.includes('alignment-asset') || !canView) {
    return null;
  }

  return <PlaaSnapshotBarContent />;
}

function PlaaSnapshotBarContent() {
  const status = useCurrentSnapshotStatus();
  return <PlaaSnapshotBarBar status={status} />;
}
