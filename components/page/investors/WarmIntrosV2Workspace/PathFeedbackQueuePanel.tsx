'use client';

import { useEffect, useState } from 'react';
import { Drawer } from '@/components/common/Drawer/Drawer';
import { ProximityCodeBadge } from '@/components/page/investors/ProximityCodeBadge/ProximityCodeBadge';
import { useWarmPathV2FeedbackQueue } from '@/services/investors/hooks/useWarmPathV2FeedbackQueue';
import type { WarmPathFeedbackRow } from '@/services/investors/warm-intros-v2.types';
import s from './PathFeedbackQueuePanel.module.scss';

interface Props {
  open: boolean;
  onClose: () => void;
  canEdit: boolean;
  onOpenInvestor: (targetProfileUid: string) => void;
}

const PAGE_LIMIT = 25;

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function referLabel(row: WarmPathFeedbackRow): string {
  if (row.canRefer === 'yes') return 'Can refer';
  if (row.canRefer === 'no') return 'Can’t refer';
  return 'Note only';
}

/**
 * Admin queue of Warm Path v2 refer answers + notes. Mirrors CrosswalkReviewPanel
 * chrome; gated on investor_db.edit.
 */
export function PathFeedbackQueuePanel({ open, onClose, canEdit, onOpenInvestor }: Props) {
  const [page, setPage] = useState(0);
  const [q, setQ] = useState('');
  const [qApplied, setQApplied] = useState('');

  useEffect(() => {
    if (!open) {
      setPage(0);
      setQ('');
      setQApplied('');
    }
  }, [open]);

  const { data, isLoading } = useWarmPathV2FeedbackQueue(
    { q: qApplied || undefined, limit: PAGE_LIMIT, offset: page * PAGE_LIMIT },
    open && canEdit,
  );

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  return (
    <Drawer isOpen={open} onClose={onClose} width={640}>
      <div className={s.body}>
        <header className={s.header}>
          <div>
            <h2 className={s.title}>Path feedback</h2>
            <p className={s.lead}>
              Refer answers and free-text notes from Investor DB viewers. Click a row to open the investor.
            </p>
          </div>
          <button className={s.close} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        {!canEdit && <div className={s.state}>You need edit access to view the path feedback queue.</div>}

        {canEdit ? (
          <form
            className={s.searchRow}
            onSubmit={(e) => {
              e.preventDefault();
              setPage(0);
              setQApplied(q.trim());
            }}
          >
            <input
              className={s.searchInput}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search actor email or note…"
              aria-label="Search feedback"
            />
            <button type="submit" className={s.searchBtn}>
              Search
            </button>
          </form>
        ) : null}

        {canEdit && isLoading && <div className={s.state}>Loading feedback…</div>}

        {canEdit && !isLoading && items.length === 0 && <div className={s.state}>No path feedback yet.</div>}

        {canEdit && items.length > 0 && (
          <ul className={s.list}>
            {items.map((item) => (
              <li key={item.uid}>
                <button
                  type="button"
                  className={s.item}
                  onClick={() => {
                    onOpenInvestor(item.targetProfileUid);
                    onClose();
                  }}
                >
                  <div className={s.itemTop}>
                    <span className={s.investorName}>{item.investor?.name || item.targetProfileUid}</span>
                    {item.proximityCode ? <ProximityCodeBadge code={item.proximityCode} /> : null}
                  </div>
                  <div className={s.itemMeta}>
                    <span>
                      via {item.connector?.name || item.connectorProfileUid}
                      {item.isBestConnector ? ' · best' : ' · alternate'}
                    </span>
                    <span className={s.verdict}>{referLabel(item)}</span>
                  </div>
                  {item.note?.trim() ? <p className={s.note}>{item.note.trim()}</p> : null}
                  <div className={s.itemFoot}>
                    <span>{item.actorEmail || 'Unknown'}</span>
                    <span>{formatWhen(item.updatedAt)}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {canEdit && total > PAGE_LIMIT && (
          <div className={s.pager}>
            <button className={s.pageBtn} disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>
              ← Prev
            </button>
            <span className={s.pageInfo}>
              Page {page + 1} of {totalPages}
            </span>
            <button className={s.pageBtn} disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next →
            </button>
          </div>
        )}
      </div>
    </Drawer>
  );
}
