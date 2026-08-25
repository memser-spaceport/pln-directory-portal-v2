'use client';

import { useRouter } from 'next/navigation';

import { Modal } from '@/components/common/Modal';
import { useCurrentSnapshotStatus } from '@/services/plaa/hooks/useCurrentSnapshotStatus';

import styles from './PlaaSnapshotSummaryModal.module.scss';

interface PlaaSnapshotSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PlaaSnapshotSummaryModal({ isOpen, onClose }: PlaaSnapshotSummaryModalProps) {
  const router = useRouter();
  const { periodLabel, daysLeft, pointsCollected, activitiesCount, categoriesCount, activities } =
    useCurrentSnapshotStatus();

  const goToActivities = () => {
    onClose();
    router.push('/alignment-asset/activities');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      lockScroll
      ariaLabelledBy="plaa-snapshot-summary-title"
      overlayClassname={styles.topAlignedOverlay}
      className={styles.modalContainer}
    >
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.eyebrow}>Snapshot summary · preview</div>
          <div id="plaa-snapshot-summary-title" className={styles.title}>
            {periodLabel}, in review
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className={styles.body}>
          <p className={styles.summary}>
            This period you contributed <b>{activitiesCount} activities</b> across{' '}
            <b>{categoriesCount} categories</b>, collecting{' '}
            <b className={styles.points}>{pointsCollected.toLocaleString()} points</b>. The snapshot closes in{' '}
            {daysLeft} {daysLeft === 1 ? 'day' : 'days'}.
          </p>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.statValue}>{activitiesCount}</div>
              <div className={styles.statLabel}>activities</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{categoriesCount}</div>
              <div className={styles.statLabel}>categories</div>
            </div>
            <div className={styles.stat}>
              <div className={`${styles.statValue} ${styles.points}`}>{pointsCollected.toLocaleString()}</div>
              <div className={styles.statLabel}>points</div>
            </div>
          </div>

          <div className={styles.activities}>
            <div className={styles.activitiesHeader}>Activities this snapshot</div>
            {activities.map((activity, index) => (
              <div key={index} className={styles.activityRow}>
                <span className={styles.activityCategory}>{activity.category}</span>
                <span className={styles.activityTitle}>{activity.title}</span>
                <span className={styles.activityPoints}>+{activity.points} points</span>
              </div>
            ))}
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>So far this snapshot</span>
              <span className={styles.totalValue}>{pointsCollected.toLocaleString()} points</span>
            </div>
          </div>

          <div className={styles.callout}>
            <svg
              className={styles.calloutIcon}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
              <path d="M12 11v5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="12" cy="8" r="1" fill="currentColor" />
            </svg>
            <p className={styles.calloutText}>
              Points are pending until the snapshot closes. PLAA is issued at close, based on the conversion rate in
              effect at that time. Not financial advice.
            </p>
          </div>

          <button className={styles.ctaBtn} onClick={goToActivities}>
            See how to contribute more
          </button>
        </div>
      </div>
    </Modal>
  );
}
