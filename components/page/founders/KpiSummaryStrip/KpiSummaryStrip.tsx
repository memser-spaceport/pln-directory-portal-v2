'use client';

import type { KpiSummary } from '@/services/founders/types';
import { FUND_VALUES, FUND_LABEL } from '@/services/founders/constants';
import s from './KpiSummaryStrip.module.scss';

interface Props {
  data: KpiSummary | null | undefined;
  isLoading: boolean;
}

export default function KpiSummaryStrip({ data, isLoading }: Props) {
  if (!isLoading && !data) return null;

  if (isLoading) {
    return (
      <div className={s.strip}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={s.cardSkeleton} />
        ))}
      </div>
    );
  }

  const { low, medium, high } = data!.alignmentDistribution;
  const alignmentTotal = low + medium + high || 1;
  const activeSources = Object.keys(data!.sourceCoverage).length;
  const weeklyTotal = data!.weeklyNewRecords.reduce((sum, w) => sum + w.count, 0);
  const maxWeekly = Math.max(...data!.weeklyNewRecords.map((w) => w.count), 1);

  return (
    <div className={s.strip}>
      {/* Per-fund new records */}
      {FUND_VALUES.map((fund) => {
        const count = data!.newRecordsByFund[fund] ?? 0;
        return (
          <div key={fund} className={s.card}>
            <div className={s.cardLabel}>{FUND_LABEL[fund]}</div>
            <div className={s.cardValue}>{count}</div>
            <div className={s.cardSub}>new leads</div>
          </div>
        );
      })}

      {/* Alignment distribution */}
      <div className={s.card}>
        <div className={s.cardLabel}>Alignment</div>
        <div className={s.cardValue}>{high}</div>
        <div className={s.alignmentBar}>
          <div className={s.alignHigh} style={{ width: `${(high / alignmentTotal) * 100}%` }} title={`High: ${high}`} />
          <div className={s.alignMed} style={{ width: `${(medium / alignmentTotal) * 100}%` }} title={`Med: ${medium}`} />
          <div className={s.alignLow} style={{ width: `${(low / alignmentTotal) * 100}%` }} title={`Low: ${low}`} />
        </div>
        <div className={s.cardSub}>high · {medium} med · {low} low</div>
      </div>

      {/* Sources */}
      <div className={s.card}>
        <div className={s.cardLabel}>Sources</div>
        <div className={s.cardValue}>{activeSources}</div>
        <div className={s.cardSub}>active ingestion feeds</div>
      </div>

      {/* Weekly trend */}
      {data!.weeklyNewRecords.length > 0 && (
        <div className={s.card}>
          <div className={s.cardLabel}>This period</div>
          <div className={s.cardValue}>{weeklyTotal}</div>
          <div className={s.sparkline}>
            {data!.weeklyNewRecords.map((w, i) => (
              <div
                key={i}
                className={s.sparkBar}
                style={{ height: `${Math.max(4, (w.count / maxWeekly) * 28)}px` }}
                title={`${w.weekStart.slice(0, 10)}: ${w.count}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
