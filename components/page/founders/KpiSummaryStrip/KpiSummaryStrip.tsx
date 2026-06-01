'use client';

import type { KpiSummary } from '@/services/founders/types';
import { FUND_VALUES, FUND_LABEL } from '@/services/founders/constants';
import s from './KpiSummaryStrip.module.scss';

interface Props {
  data: KpiSummary | null | undefined;
  isLoading: boolean;
}

// TODO: This component renders a best-effort view based on the placeholder KpiSummary type.
// Coordinate with backend to confirm the exact GET /v1/founder-sourcing/kpis/summary?weeks=4
// response shape and update accordingly.
export default function KpiSummaryStrip({ data, isLoading }: Props) {
  if (!isLoading && !data) return null;

  if (isLoading) {
    return (
      <div className={s.strip}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={s.cardSkeleton} />
        ))}
      </div>
    );
  }

  return (
    <div className={s.strip}>
      {/* By Fund */}
      {FUND_VALUES.map((fund) => {
        const stat = data?.byFund?.[fund];
        return (
          <div key={fund} className={s.card}>
            <div className={s.cardLabel}>{FUND_LABEL[fund]}</div>
            <div className={s.cardValue}>{stat?.total ?? '—'}</div>
            {stat && (
              <div className={s.cardSub}>
                {stat.new} new · {stat.approved} approved
              </div>
            )}
          </div>
        );
      })}

      {/* Weekly trend (if present) */}
      {(data?.weeklyCount ?? []).length > 0 && (
        <div className={s.card}>
          <div className={s.cardLabel}>Last 4 weeks</div>
          <div className={s.sparkline}>
            {data!.weeklyCount.map((w, i) => (
              <div
                key={i}
                className={s.sparkBar}
                style={{ height: `${Math.max(4, (w.count / Math.max(...data!.weeklyCount.map((x) => x.count), 1)) * 32)}px` }}
                title={`${w.week}: ${w.count}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
