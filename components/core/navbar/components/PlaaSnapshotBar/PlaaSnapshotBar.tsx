'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

import { useCurrentSnapshotStatus } from '@/services/plaa/hooks/useCurrentSnapshotStatus';
import { PlaaSnapshotSummaryModal } from './PlaaSnapshotSummaryModal';

import styles from './PlaaSnapshotBar.module.scss';

/**
 * Persistent "current snapshot" status bar for the PLAA section — period label,
 * days left to contribute, progress through the period, and points collected
 * so far this snapshot. Ported from the Profile.dc.html design's snapshot bar.
 *
 * Purely presentational: all data comes from useCurrentSnapshotStatus(). That
 * hook currently mocks pointsCollected — see its file for how a backend dev
 * wires in the real per-user total.
 */
export function PlaaSnapshotBar() {
  const pathname = usePathname();
  const [summaryOpen, setSummaryOpen] = useState(false);
  const { periodLabel, daysLeft, progressPct, pointsCollected } = useCurrentSnapshotStatus();

  if (!pathname?.includes('alignment-asset')) {
    return null;
  }

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
