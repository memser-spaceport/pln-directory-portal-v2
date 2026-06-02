'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import PointsRoundSelector from './points-round-selector';
import { useLifetimePoints, useSnapshotPoints, PointsRecord } from '@/services/points/hooks/usePoints';
import { getRoundDateInfo, getSnapshotLastDay, isWithinFirstDaysOfMonth } from '@/utils/plaa-round.utils';
import styles from './points-dashboard.module.css';

/* ==========================================================================
   Points & Activities Dashboard
   ========================================================================== */

interface PointsDashboardProps {
  /** The current active PLAA round number (e.g. 15 for April 2026). */
  currentRound: number;
  /**
   * The round number whose page we are currently viewing.
   * Defaults to currentRound (current-round page).
   */
  pageRound?: number;
}

/* --------------------------------------------------------------------------
   Empty-state illustration
   -------------------------------------------------------------------------- */
function EmptyStateIcon() {
  return (
    <>
      <Image
        src="/icons/rounds/empty-illustration.svg"
        alt=""
        width={350}
        height={234}
        aria-hidden="true"
        className={`${styles['points-dashboard__empty-icon']} ${styles['points-dashboard__empty-icon--desktop']}`}
      />
      <Image
        src="/icons/rounds/empty-illustration-mobile.svg"
        alt=""
        width={170}
        height={114}
        aria-hidden="true"
        className={`${styles['points-dashboard__empty-icon']} ${styles['points-dashboard__empty-icon--mobile']}`}
      />
    </>
  );
}

/* --------------------------------------------------------------------------
   Skeleton loader row
   -------------------------------------------------------------------------- */
// function SkeletonRow() {
//   return (
//     <div className={styles['points-dashboard__skeleton-row']}>
//       <div className={styles['points-dashboard__skeleton-cell']} style={{ width: '18%' }} />
//       <div className={styles['points-dashboard__skeleton-cell']} style={{ width: '22%' }} />
//       <div className={styles['points-dashboard__skeleton-cell']} style={{ width: '30%' }} />
//       <div className={styles['points-dashboard__skeleton-cell']} style={{ width: '12%' }} />
//     </div>
//   );
// }

/* --------------------------------------------------------------------------
   Activity table row – desktop
   -------------------------------------------------------------------------- */
function ActivityTableRow({ record }: { record: PointsRecord }) {
  return (
    <tr className={styles['points-dashboard__table-row']}>
      <td className={styles['points-dashboard__table-cell']}>
        <span className={styles['points-dashboard__category-badge']}>{record.category}</span>
      </td>
      <td className={styles['points-dashboard__table-cell']}>{record.activityName}</td>
      <td className={`${styles['points-dashboard__table-cell']} ${styles['points-dashboard__table-cell--description']}`} title={record.description}>{record.description}</td>
      <td className={styles['points-dashboard__table-cell']}>
        <span className={styles['points-dashboard__points-value']}>{(Number(record.pointsCollectedPerSnapshot) || 0).toLocaleString()}</span>
        <span className={styles['points-dashboard__points-label']}>&nbsp;points</span>
      </td>
    </tr>
  );
}

/* --------------------------------------------------------------------------
   Activity card – mobile
   -------------------------------------------------------------------------- */
function ActivityCard({ record }: { record: PointsRecord }) {
  return (
    <div className={styles['points-dashboard__card']}>
      <span className={styles['points-dashboard__card-category']}>{record.category}</span>
      <p className={styles['points-dashboard__card-activity']}>{record.activityName}</p>
      <p className={styles['points-dashboard__card-points']}>
        <span className={styles['points-dashboard__points-value']}>{(Number(record.pointsCollectedPerSnapshot) || 0).toLocaleString()}</span>
        <span className={styles['points-dashboard__points-label']}>&nbsp;points</span>
      </p>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Main component
   -------------------------------------------------------------------------- */
export default function PointsDashboard({ currentRound, pageRound }: PointsDashboardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const viewingRound = pageRound ?? currentRound;

  const viewingRoundDate = getRoundDateInfo(viewingRound);
  const { snapshotPeriod, label: snapshotLabel } = viewingRoundDate;

  const { data: lifetimeData, isLoading: lifetimeLoading, error: lifetimeError } = useLifetimePoints();
  const { data: snapshotData, isLoading: snapshotLoading, error: snapshotError } = useSnapshotPoints(snapshotPeriod);

  const isLoading = lifetimeLoading || snapshotLoading;
  const hasError = lifetimeError || snapshotError;

  // Only render once data has finished loading
  if (isLoading) return null;

  // Hide section when not logged in or API refused
  if (lifetimeData === null || hasError) return null;

  const totalLifetime = lifetimeData?.totalPoints ?? 0;
  const records = snapshotData?.records ?? [];

  // Hide section when both lifetime and snapshot are empty (user has no points at all)
  if (totalLifetime === 0 && records.length === 0) return null;

  // Determine empty-state variant
  const isSnapshotEmpty = records.length === 0;
  const now = new Date();
  const isCurrentMonthSnapshot =
    viewingRoundDate.year === now.getFullYear() &&
    viewingRoundDate.monthNumber === now.getMonth() + 1;
  const isRecentlyStarted = isSnapshotEmpty && isCurrentMonthSnapshot && isWithinFirstDaysOfMonth(5);

  const lastDay = getSnapshotLastDay(snapshotPeriod);
  const lastDayFormatted = lastDay.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const isViewingCurrentRound = viewingRound === currentRound;

  return (
    <section className={styles['points-dashboard']}>
      {/* ----------------------------------------------------------------
          Header – always visible
          ---------------------------------------------------------------- */}
      <div className={styles['points-dashboard__header']}>
        <h2 className={styles['points-dashboard__title']}>Points &amp; Activities Dashboard</h2>
        <button
          className={styles['points-dashboard__toggle']}
          onClick={() => setIsExpanded((v) => !v)}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Collapse dashboard' : 'Expand dashboard'}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={isExpanded ? styles['points-dashboard__toggle-icon--open'] : ''}
          >
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="#475569"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* ----------------------------------------------------------------
          Collapsible body
          ---------------------------------------------------------------- */}
      {isExpanded && (
        <div className={styles['points-dashboard__body']}>
          {/* Round selector */}
          <div className={styles['points-dashboard__selector-wrap']}>
            <PointsRoundSelector
              currentRound={currentRound}
              viewingRound={viewingRound}
            />
          </div>

          {/* ----------------------------------------------------------------
              Loading skeleton
              ---------------------------------------------------------------- */}
          {/* {isLoading && (
            <div className={styles['points-dashboard__loading']}>
              <div className={styles['points-dashboard__points-cards']}>
                <div className={`${styles['points-dashboard__points-card']} ${styles['points-dashboard__skeleton-card']}`} />
                <div className={`${styles['points-dashboard__points-card']} ${styles['points-dashboard__skeleton-card']}`} />
              </div>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          )} */}

          {/* ----------------------------------------------------------------
              Points cards + activity table/list (non-empty state)
              ---------------------------------------------------------------- */}
          {!isSnapshotEmpty && (
            <>
              {/* Points summary cards */}
              <div className={styles['points-dashboard__points-cards']}>
                <div className={styles['points-dashboard__points-card']}>
                  <p className={styles['points-dashboard__points-card-label']}>Lifetime Points</p>
                  <p className={styles['points-dashboard__points-card-value']}>
                    {totalLifetime.toLocaleString()}
                    <span className={styles['points-dashboard__points-card-unit']}>&nbsp;points</span>
                  </p>
                </div>
                <div className={styles['points-dashboard__points-card']}>
                  <p className={styles['points-dashboard__points-card-label']}>
                    Points for <strong>{snapshotLabel}</strong>
                  </p>
                  <p className={styles['points-dashboard__points-card-value']}>
                    {records.reduce((sum, r) => sum + (Number(r.pointsCollectedPerSnapshot) || 0), 0).toLocaleString()}
                    <span className={styles['points-dashboard__points-card-unit']}>&nbsp;points</span>
                  </p>
                </div>
              </div>

              {/* Desktop table */}
              <div className={styles['points-dashboard__table-wrap']}>
                  <table className={styles['points-dashboard__table']}>
                  <colgroup>
                    <col className={styles['points-dashboard__col--category']} />
                    <col className={styles['points-dashboard__col--activity']} />
                    <col className={styles['points-dashboard__col--description']} />
                    <col className={styles['points-dashboard__col--points']} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className={styles['points-dashboard__table-head']}>
                        <span className={styles['points-dashboard__table-head-text']}>Category</span>
                      </th>
                      <th className={styles['points-dashboard__table-head']}>Activity Name</th>
                      <th className={styles['points-dashboard__table-head']}>Description</th>
                      <th className={styles['points-dashboard__table-head']}>Points Collected Per Snapshot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record, idx) => (
                      <ActivityTableRow key={idx} record={record} />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className={styles['points-dashboard__cards-wrap']}>
                {records.map((record, idx) => (
                  <ActivityCard key={idx} record={record} />
                ))}
              </div>
            </>
          )}

          {/* ----------------------------------------------------------------
              Empty state – recently started snapshot (within first 5 days)
              ---------------------------------------------------------------- */}
          {isSnapshotEmpty && isRecentlyStarted && (
            <div className={styles['points-dashboard__empty']}>
              <div className={styles['points-dashboard__points-cards']}>
                <div className={styles['points-dashboard__points-card']}>
                  <p className={styles['points-dashboard__points-card-label']}>Lifetime Points</p>
                  <p className={styles['points-dashboard__points-card-value']}>
                    {totalLifetime.toLocaleString()}
                    <span className={styles['points-dashboard__points-card-unit']}>&nbsp;points</span>
                  </p>
                </div>
              </div>
              <div className={styles['points-dashboard__empty-content']}>
                <EmptyStateIcon />
                <p className={styles['points-dashboard__empty-title']}>
                  This snapshot has recently started, so no activity or points data has been recorded so far.
                </p>
                <p className={styles['points-dashboard__empty-desc']}>
                  Please view the{' '}
                  <Link href="/alignment-asset/activities" className={styles['points-dashboard__empty-link']}>
                    Activities page
                  </Link>{' '}
                  to start collecting points before the snapshot ends on {lastDayFormatted}.
                </p>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------
              Empty state – past snapshot with no data for this account
              ---------------------------------------------------------------- */}
          {isSnapshotEmpty && !isRecentlyStarted && (
            <div className={styles['points-dashboard__empty']}>
              <div className={styles['points-dashboard__empty-content']}>
                <EmptyStateIcon />
                <p className={styles['points-dashboard__empty-title']}>
                  No activity or points data was found for your account in the selected snapshot.
                </p>
                <p className={styles['points-dashboard__empty-desc']}>
                  You may be viewing a snapshot in which you did not collect points. If this is a past snapshot, new
                  activity will apply to the current snapshot only. Visit the{' '}
                  <Link href="/alignment-asset/activities" className={styles['points-dashboard__empty-link']}>
                    Activities page
                  </Link>{' '}
                  to start collecting points before the current snapshot ends.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
