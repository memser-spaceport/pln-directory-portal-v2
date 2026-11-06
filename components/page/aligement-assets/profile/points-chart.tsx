'use client';

import type { ContributionHistoryEntry } from '@/services/plaa/hooks/useProfileData';

import { niceMax, pickLabelIndices } from './chart-scale';
import styles from './chart.module.css';

interface PointsChartProps {
  entries: ContributionHistoryEntry[];
}

const CHART_WIDTH = 720;
const CHART_HEIGHT = 268;
const PLOT_LEFT = 52;
const PLOT_RIGHT = 668;
const PLOT_TOP = 16;
const PLOT_BOTTOM = 210;
const BAR_WIDTH = 40;
const GRID_LINES = 5;
const MAX_X_LABELS = 6;

const POINTS_COLOR = '#4f9eff';

function buildChart(entries: ContributionHistoryEntry[]) {
  const plotWidth = PLOT_RIGHT - PLOT_LEFT;
  const plotHeight = PLOT_BOTTOM - PLOT_TOP;
  const step = plotWidth / entries.length;
  const maxPoints = niceMax(Math.max(...entries.map((e) => e.points ?? 0), 1));

  const grid = Array.from({ length: GRID_LINES }, (_, i) => PLOT_TOP + (plotHeight / (GRID_LINES - 1)) * i);
  const axisTicks = grid.map((y, i) => ({ y, label: Math.round((maxPoints * (GRID_LINES - 1 - i)) / (GRID_LINES - 1)) }));

  const centers = entries.map((_, i) => PLOT_LEFT + step * i + step / 2);
  const barWidth = Math.min(BAR_WIDTH, step * 0.6);

  // A snapshot still waiting on its count is left empty rather than drawn as zero.
  const bars = entries
    .map((e, i) => {
      const h = ((e.points ?? 0) / maxPoints) * plotHeight;
      return { x: centers[i] - barWidth / 2, y: PLOT_BOTTOM - h, w: barWidth, h, value: e.points, has: e.points !== null };
    })
    .filter((b) => b.has);

  const labelIndices = pickLabelIndices(entries.length, MAX_X_LABELS);
  const labels = entries
    .map((e, i) => ({ x: centers[i], period: e.period, i }))
    .filter(({ i }) => labelIndices.has(i));

  return { grid, bars, axisTicks, labels };
}

/**
 * Points collected per snapshot. The PLAA those points produced, and the
 * balance they built, are the Balance History tab's story — this one is the
 * input, which is what the snapshot list underneath breaks down.
 */
export default function PointsChart({ entries }: PointsChartProps) {
  // Nothing to plot for a member whose points have not landed yet.
  if (entries.length === 0 || !entries.some((e) => e.points !== null)) return null;

  const chart = buildChart(entries);

  return (
    <div className={styles.card}>
      <div className={styles.chartHeader}>
        <div>
          <h3 className={styles.chartTitle}>Points collected per snapshot</h3>
          <p className={styles.chartSubtitle}>What you collected in each snapshot, newest at the right.</p>
        </div>
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.legendSwatch} style={{ background: 'rgba(27, 77, 255, 0.22)' }} />
            Points collected
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className={styles.chart}>
        {chart.grid.map((y, i) => (
          <line key={i} x1={PLOT_LEFT} y1={y} x2={PLOT_RIGHT} y2={y} stroke="#f1f5f9" strokeWidth="1" />
        ))}
        {chart.axisTicks.map((t, i) => (
          <text key={i} x={PLOT_LEFT - 10} y={t.y + 4} textAnchor="end" fontSize="10" fill={POINTS_COLOR}>
            {t.label.toLocaleString()}
          </text>
        ))}
        {chart.bars.map((b, i) => (
          <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx="4" fill="rgba(21,111,247,0.20)" />
        ))}
        {chart.bars.map((b, i) => (
          <text
            key={i}
            x={b.x + b.w / 2}
            y={Math.max(b.y - 8, PLOT_TOP + 10)}
            textAnchor="middle"
            fontSize="11"
            fontWeight="600"
            fill={POINTS_COLOR}
          >
            {(b.value ?? 0).toLocaleString()}
          </text>
        ))}
        {chart.labels.map((l, i) => (
          <text key={i} x={l.x} y={PLOT_BOTTOM + 24} textAnchor="middle" fontSize="11" fill="#94a3b8">
            {l.period}
          </text>
        ))}
      </svg>

      <div className={styles.axisLabels}>
        <span className={styles.axisLabel}>Points per snapshot</span>
      </div>
    </div>
  );
}
