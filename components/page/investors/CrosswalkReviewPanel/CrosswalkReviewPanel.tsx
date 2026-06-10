'use client';

import { useEffect, useState } from 'react';
import { Drawer } from '@/components/common/Drawer/Drawer';
import { useCrosswalkReview } from '@/services/investors/hooks/useCrosswalkReview';
import { useResolveCrosswalk } from '@/services/investors/hooks/useResolveCrosswalk';
import { useInvestorsAnalytics } from '@/analytics/investors.analytics';
import type { CrosswalkReviewItem } from '@/services/investors/types';
import s from './CrosswalkReviewPanel.module.scss';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Resolution is gated on investor_db.edit. */
  canEdit: boolean;
}

const PAGE_LIMIT = 25;

/**
 * Crosswalk review queue: entity-resolution candidates the pathfinder could not
 * auto-link. Confirm (link) or reject (keep separate) routes to the resolve
 * endpoint and logs a PathfinderCorrection. Admin sub-view of Warm Intros, gated
 * on investor_db.edit.
 */
export function CrosswalkReviewPanel({ open, onClose, canEdit }: Props) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!open) {
      setPage(1);
    }
  }, [open]);

  const { data, isLoading } = useCrosswalkReview(page, PAGE_LIMIT, open && canEdit);

  const resolve = useResolveCrosswalk();
  const { isPending, variables } = resolve;

  const { trackCrosswalkConfirmed, trackCrosswalkRejected } = useInvestorsAnalytics();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  const onResolve = async (item: CrosswalkReviewItem, confirmed: boolean) => {
    const ok = await resolve.mutateAsync({ id: item.id, confirmed });
    if (ok) {
      if (confirmed) trackCrosswalkConfirmed({ crosswalkId: item.id });
      else trackCrosswalkRejected({ crosswalkId: item.id });
    }
  };

  return (
    <Drawer isOpen={open} onClose={onClose} width={640}>
      <div className={s.body}>
        <header className={s.header}>
          <div>
            <h2 className={s.title}>Crosswalk review</h2>
            <p className={s.lead}>
              Entity matches the pathfinder couldn&apos;t resolve automatically. Confirm to link the two records, or
              reject to keep them separate.
            </p>
          </div>
          <button className={s.close} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        {!canEdit && <div className={s.state}>You need edit access to review crosswalk candidates.</div>}

        {canEdit && isLoading && <div className={s.state}>Loading review queue…</div>}

        {canEdit && !isLoading && items.length === 0 && (
          <div className={s.state}>Nothing to review — all entities are resolved.</div>
        )}

        {canEdit && items.length > 0 && (
          <ul className={s.list}>
            {items.map((item) => (
              <li key={item.id} className={s.item}>
                <div className={s.pair}>
                  <div className={s.entity}>
                    <div className={s.entityLabel}>{item.source_label}</div>
                    {item.source_domain && <div className={s.entitySub}>{item.source_domain}</div>}
                  </div>
                  <span className={s.eq}>↔</span>
                  <div className={s.entity}>
                    <div className={s.entityLabel}>{item.candidate_label}</div>
                    {item.candidate_domain && <div className={s.entitySub}>{item.candidate_domain}</div>}
                  </div>
                </div>
                <div className={s.metaRow}>
                  <span className={s.confidence}>{Math.round(item.match_confidence * 100)}% match</span>
                  {item.reason && <span className={s.reason}>{item.reason}</span>}
                </div>
                <div className={s.actions}>
                  <button
                    type="button"
                    className={s.confirmBtn}
                    disabled={isPending && variables?.id === item.id}
                    onClick={() => onResolve(item, true)}
                  >
                    {isPending && variables?.id === item.id ? '…' : 'Confirm (link)'}
                  </button>
                  <button
                    type="button"
                    className={s.rejectBtn}
                    disabled={isPending && variables?.id === item.id}
                    onClick={() => onResolve(item, false)}
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {canEdit && total > PAGE_LIMIT && (
          <div className={s.pager}>
            <button className={s.pageBtn} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              ← Prev
            </button>
            <span className={s.pageInfo}>
              Page {page} of {totalPages}
            </span>
            <button className={s.pageBtn} disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next →
            </button>
          </div>
        )}
      </div>
    </Drawer>
  );
}
