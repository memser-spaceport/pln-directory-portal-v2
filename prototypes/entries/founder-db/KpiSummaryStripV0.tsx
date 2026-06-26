'use client';

// V0 stats — the production KPI strip (per-fund new leads, Sources, This period),
// with one change: the Alignment card uses our shared traffic-light tier scale
// (green/amber/grey) and is derived from the founder rows so it agrees with the
// table cut-line. Everything else mirrors production exactly.
import type { FounderItem, KpiSummary } from '@/services/founders/types';
import { FUND_VALUES, FUND_LABEL } from '@/services/founders/constants';
// Reuse the production strip/card layout 1:1.
import s from '@/components/page/founders/KpiSummaryStrip/KpiSummaryStrip.module.scss';
import { PROMISING_THRESHOLD, STRONG_FIT_THRESHOLD } from './tiers';
import k from './KpiSummaryStripV0.module.scss';

interface Props {
  founders: FounderItem[];
  kpi: KpiSummary;
}

export default function KpiSummaryStripV0({ founders, kpi }: Props) {
  // Alignment distribution derived from the same rows the table shows (so the
  // counts match the cut-line), using the shared tier thresholds.
  const high = founders.filter((f) => (f.alignmentMax ?? 0) >= STRONG_FIT_THRESHOLD).length;
  const medium = founders.filter(
    (f) => (f.alignmentMax ?? 0) >= PROMISING_THRESHOLD && (f.alignmentMax ?? 0) < STRONG_FIT_THRESHOLD,
  ).length;
  const low = founders.filter((f) => (f.alignmentMax ?? 0) < PROMISING_THRESHOLD).length;
  const alignmentTotal = high + medium + low || 1;

  const activeSources = Object.keys(kpi.sourceCoverage).length;
  const weeklyTotal = kpi.weeklyNewRecords.reduce((sum, w) => sum + w.count, 0);
  const maxWeekly = Math.max(...kpi.weeklyNewRecords.map((w) => w.count), 1);

  return (
    <div className={s.strip}>
      {/* Per-fund new records (production). */}
      {FUND_VALUES.map((fund) => (
        <div key={fund} className={s.card}>
          <div className={s.cardLabel}>{FUND_LABEL[fund]}</div>
          <div className={s.cardValue}>{kpi.newRecordsByFund[fund] ?? 0}</div>
          <div className={s.cardSub}>new leads</div>
        </div>
      ))}

      {/* Alignment distribution — production card, recolored to the tier scale. */}
      <div className={s.card}>
        <div className={s.cardLabel}>Alignment</div>
        <div className={s.cardValue}>{high}</div>
        <div className={s.alignmentBar}>
          <div className={k.segHigh} style={{ width: `${(high / alignmentTotal) * 100}%` }} title={`High: ${high}`} />
          <div className={k.segMed} style={{ width: `${(medium / alignmentTotal) * 100}%` }} title={`Med: ${medium}`} />
          <div className={k.segLow} style={{ width: `${(low / alignmentTotal) * 100}%` }} title={`Low: ${low}`} />
        </div>
        <div className={s.cardSub}>
          high · {medium} med · {low} low
        </div>
      </div>

      {/* Sources (production). */}
      <div className={s.card}>
        <div className={s.cardLabel}>Sources</div>
        <div className={s.cardValue}>{activeSources}</div>
        <div className={s.cardSub}>active ingestion feeds</div>
      </div>

      {/* Weekly trend (production). */}
      {kpi.weeklyNewRecords.length > 0 && (
        <div className={s.card}>
          <div className={s.cardLabel}>This period</div>
          <div className={s.cardValue}>{weeklyTotal}</div>
          <div className={s.sparkline}>
            {kpi.weeklyNewRecords.map((w, i) => (
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
