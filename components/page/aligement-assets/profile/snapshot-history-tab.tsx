'use client';

import { useState } from 'react';

import type { SnapshotHistoryEntry } from '@/services/plaa/hooks/useProfileData';
import ChevronIcon from './chevron-icon';

import styles from './snapshot-history-tab.module.css';

interface SnapshotHistoryTabProps {
  entries: SnapshotHistoryEntry[];
}

// Matches the wording the rounds dashboard already uses for an open snapshot.
const PENDING_LABEL = 'Pending';

function dashOr(value: number | null, suffix = ''): string {
  return value === null ? '—' : `${value.toLocaleString()}${suffix}`;
}

export default function SnapshotHistoryTab({ entries }: SnapshotHistoryTabProps) {
  const [openPeriod, setOpenPeriod] = useState<string | null>(null);

  if (entries.length === 0) {
    return (
      <div className={styles.card}>
        <div className={styles.itemRow}>
          <span className={styles.itemTitle}>No snapshot history yet</span>
        </div>
      </div>
    );
  }

  const totalPoints = entries.some((e) => e.points === null)
    ? null
    : entries.reduce((sum, e) => sum + (e.points ?? 0), 0);
  const totalPlaa = entries.reduce((sum, e) => sum + e.plaaTotal, 0);

  return (
    <div className={styles.card}>
      <div className={styles.headerRow}>
        <span>Snapshot</span>
        <span>Activities</span>
        <span>Categories</span>
        <span>Points collected</span>
        <span>PLAA</span>
        <span />
      </div>

      {entries.map((entry) => {
        const isOpen = openPeriod === entry.period;
        return (
          <div key={entry.period} className={styles.row}>
            <button
              className={styles.rowBtn}
              onClick={() => setOpenPeriod(isOpen ? null : entry.period)}
              aria-expanded={isOpen}
            >
              <span className={styles.period}>{entry.period}</span>
              <span className={styles.cell}>{entry.activities ?? '—'}</span>
              <span className={styles.cell}>{entry.categories ?? '—'}</span>
              <span className={styles.pointsCell}>
                {entry.isPending ? PENDING_LABEL : dashOr(entry.points, ' points')}
              </span>
              <span className={styles.plaaCell}>
                {entry.isPending ? PENDING_LABEL : entry.plaaTotal.toLocaleString()}
              </span>
              <span className={styles.caretCell}>
                <ChevronIcon expanded={isOpen} />
              </span>
            </button>

            {isOpen && (
              <div className={styles.expanded}>
                <div className={styles.expandedInner}>
                  <div className={styles.itemsHeader}>Activities this snapshot</div>
                  {entry.items && entry.items.length > 0 ? (
                    entry.items.map((item, index) => (
                      <div key={index} className={styles.itemRow}>
                        <span className={styles.itemCategory}>{item.category}</span>
                        <span className={styles.itemTitle}>{item.title}</span>
                        <span className={styles.itemPoints}>+{item.points} points</span>
                      </div>
                    ))
                  ) : (
                    <div className={styles.itemRow}>
                      <span className={styles.itemTitle}>Per-activity breakdown not yet available</span>
                    </div>
                  )}

                  <div className={styles.conversionRow}>
                    <span className={styles.conversionLabel}>Activity rewards</span>
                    <span className={styles.conversionValue}>
                      <span className={styles.conversionPoints}>{dashOr(entry.points, ' points')}</span>
                      <span className={styles.conversionArrow}> &rarr; </span>
                      <span className={styles.conversionPlaa}>+{entry.activityPlaa.toLocaleString()} PLAA</span>
                    </span>
                  </div>

                  {entry.hasInfra && (
                    <div className={styles.infraRow}>
                      <span className={styles.infraBadge}>Infra Member</span>
                      <span className={styles.infraLabel}>Infra rewards, granted in PLAA</span>
                      <span className={styles.infraValue}>+{entry.infra.toLocaleString()} PLAA</span>
                    </div>
                  )}

                  <div className={styles.totalRow}>
                    <span className={styles.totalLabel}>{entry.period} total</span>
                    <span className={styles.totalValue}>{entry.plaaTotal.toLocaleString()} PLAA</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className={styles.footerRow}>
        <span className={styles.footerLabel}>Total to date</span>
        <span />
        <span />
        <span className={styles.footerPoints}>{dashOr(totalPoints, ' points')}</span>
        <span className={styles.footerPlaa}>{totalPlaa.toLocaleString()}</span>
        <span />
      </div>
    </div>
  );
}
