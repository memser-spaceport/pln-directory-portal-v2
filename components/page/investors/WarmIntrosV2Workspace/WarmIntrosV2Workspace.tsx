'use client';

import { useEffect } from 'react';
import { useWarmIntrosV2Paths } from '@/services/investors/hooks/useWarmIntrosV2Paths';
import { WARM_INTROS_V2_DEFAULT_TARGET_SET } from '@/services/investors/warm-intros-v2.types';
import s from './WarmIntrosV2Workspace.module.scss';

interface Props {
  onCountChange?: (count: number) => void;
}

const PAGE_LIMIT = 50;

/**
 * Minimal Warm Intros v2 shell (S3-T2). Filters / polished table / drawer / modal
 * land in S3-T3+. Default targetSet is neuro-fund-i until filter UI exists.
 */
export function WarmIntrosV2Workspace({ onCountChange }: Props) {
  const { data, isLoading, isError, error } = useWarmIntrosV2Paths({
    targetSet: WARM_INTROS_V2_DEFAULT_TARGET_SET,
    rank: 1,
    limit: PAGE_LIMIT,
    offset: 0,
  });

  const paths = data?.paths ?? [];
  const total = data?.total ?? paths.length;

  useEffect(() => {
    if (data) onCountChange?.(total);
  }, [data, total, onCountChange]);

  return (
    <div className={s.root}>
      <div className={s.header}>
        <h2 className={s.title}>Warm Intros v2</h2>
        <p className={s.desc}>
          Enriched paths from MasterProfile + WarmPathV2 ({WARM_INTROS_V2_DEFAULT_TARGET_SET}). Filters and table polish
          come in later steps.
        </p>
      </div>

      {isLoading && <div className={s.state}>Loading paths…</div>}

      {isError && (
        <div className={s.stateError}>
          Failed to load Warm Intros v2
          {error instanceof Error && error.message ? `: ${error.message}` : ''}.
        </div>
      )}

      {!isLoading && !isError && paths.length === 0 && <div className={s.state}>No paths yet for this target set.</div>}

      {!isLoading && !isError && paths.length > 0 && (
        <div className={s.listWrap}>
          <div className={s.meta}>
            Showing {paths.length}
            {total > paths.length ? ` of ${total}` : ''} paths
          </div>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Investor</th>
                <th>Proximity</th>
                <th>Score</th>
                <th>Best connector</th>
              </tr>
            </thead>
            <tbody>
              {paths.map((row) => (
                <tr key={row.uid}>
                  <td>{row.investor?.name ?? row.targetProfileUid}</td>
                  <td>{row.proximityCode}</td>
                  <td>{row.scorePercent}%</td>
                  <td>{row.bestConnector?.name ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
