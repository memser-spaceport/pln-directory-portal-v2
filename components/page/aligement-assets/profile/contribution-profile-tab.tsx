'use client';

import { useState } from 'react';

import type { ContributionHistoryEntry } from '@/services/plaa/hooks/useProfileData';

import styles from './contribution-profile-tab.module.css';

interface ContributionProfileTabProps {
  entries: ContributionHistoryEntry[];
  /** Real balance from the hero card, null while unconfirmed. Not derived from
   * entries[last].cum, which is still mocked history and would disagree. */
  currentBalance: number | null;
}

const CHART_WIDTH = 720;
const CHART_HEIGHT = 268;
const PLOT_LEFT = 52;
const PLOT_RIGHT = 668;
const PLOT_TOP = 16;
const PLOT_BOTTOM = 210;
const BAR_WIDTH = 40;
const GRID_LINES = 5;

/** Round a max value up to a "nice" tick ceiling so axis labels aren't awkward fractions. */
function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / magnitude) * magnitude;
}

function buildChart(entries: ContributionHistoryEntry[]) {
  const maxPoints = niceMax(Math.max(...entries.map((e) => e.points), 1));
  const maxBalance = niceMax(Math.max(...entries.map((e) => e.cum), 1));
  const plotWidth = PLOT_RIGHT - PLOT_LEFT;
  const plotHeight = PLOT_BOTTOM - PLOT_TOP;
  const step = plotWidth / entries.length;

  const grid = Array.from({ length: GRID_LINES }, (_, i) => PLOT_TOP + (plotHeight / (GRID_LINES - 1)) * i);
  const leftAxisTicks = grid.map((y, i) => ({ y, label: Math.round((maxPoints * (GRID_LINES - 1 - i)) / (GRID_LINES - 1)) }));
  const rightAxisTicks = grid.map((y, i) => ({ y, label: Math.round((maxBalance * (GRID_LINES - 1 - i)) / (GRID_LINES - 1)) }));

  const centers = entries.map((_, i) => PLOT_LEFT + step * i + step / 2);

  const bars = entries.map((e, i) => {
    const h = (e.points / maxPoints) * plotHeight;
    return { x: centers[i] - BAR_WIDTH / 2, y: PLOT_BOTTOM - h, w: BAR_WIDTH, h, value: e.points };
  });

  const dots = entries.map((e, i) => ({
    cx: centers[i],
    cy: PLOT_BOTTOM - (e.cum / maxBalance) * plotHeight,
  }));

  const line = dots.map((d) => `${d.cx},${d.cy}`).join(' ');
  const labels = entries.map((e, i) => ({ x: centers[i], period: e.period }));
  const hoverZones = entries.map((e, i) => ({ x: centers[i] - step / 2, w: step, balance: e.cum }));

  return { grid, bars, dots, line, labels, leftAxisTicks, rightAxisTicks, hoverZones };
}

export default function ContributionProfileTab({ entries, currentBalance }: ContributionProfileTabProps) {
  const chart = buildChart(entries);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const totalPoints = entries.reduce((sum, p) => sum + p.points, 0);
  const totalPlaa = entries.reduce((sum, p) => sum + p.plaa, 0);
  const totalInfra = entries.reduce((sum, p) => sum + p.infra, 0);
  const totalRedeemed = entries.reduce((sum, p) => sum + p.redeemed, 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
      <div className={styles.card}>
        <div className={styles.chartHeader}>
          <div>
            <h3 className={styles.chartTitle}>Points and PLAA balance over time</h3>
            <p className={styles.chartSubtitle}>Points collected in each snapshot, and your PLAA balance after each close.</p>
          </div>
          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={styles.legendSwatchBar} />
              Points collected
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendSwatchLine} />
              PLAA balance
            </span>
          </div>
        </div>

        <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className={styles.chart}>
          {chart.grid.map((y, i) => (
            <line key={i} x1={PLOT_LEFT} y1={y} x2={PLOT_RIGHT} y2={y} stroke="#f1f5f9" strokeWidth="1" />
          ))}
          {chart.leftAxisTicks.map((t, i) => (
            <text key={i} x={PLOT_LEFT - 10} y={t.y + 4} textAnchor="end" fontSize="10" fill="#4f9eff">
              {t.label.toLocaleString()}
            </text>
          ))}
          {chart.rightAxisTicks.map((t, i) => (
            <text key={i} x={PLOT_RIGHT + 10} y={t.y + 4} textAnchor="start" fontSize="10" fill="#156ff7">
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
              fill="#4f9eff"
            >
              {b.value.toLocaleString()}
            </text>
          ))}
          <polyline
            points={chart.line}
            fill="none"
            stroke="#156ff7"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {chart.dots.map((d, i) => (
            <circle
              key={i}
              cx={d.cx}
              cy={d.cy}
              r={hoveredIndex === i ? 5.5 : 4}
              fill="#fff"
              stroke="#156ff7"
              strokeWidth="2.5"
              style={{ transition: 'r .1s ease' }}
            />
          ))}
          {chart.labels.map((l, i) => (
            <text key={i} x={l.x} y={PLOT_BOTTOM + 24} textAnchor="middle" fontSize="11" fill="#94a3b8">
              {l.period}
            </text>
          ))}
          {hoveredIndex !== null && (
            <g style={{ pointerEvents: 'none' }}>
              <rect
                x={chart.dots[hoveredIndex].cx - 24}
                y={chart.dots[hoveredIndex].cy + 10}
                width="48"
                height="20"
                rx="6"
                fill="#156ff7"
              />
              <text
                x={chart.dots[hoveredIndex].cx}
                y={chart.dots[hoveredIndex].cy + 24}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="#ffffff"
              >
                {entries[hoveredIndex].cum.toLocaleString()}
              </text>
            </g>
          )}
          {chart.hoverZones.map((z, i) => (
            <rect
              key={i}
              x={z.x}
              y={PLOT_TOP}
              width={z.w}
              height={PLOT_BOTTOM - PLOT_TOP}
              fill="transparent"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: 'pointer' }}
            />
          ))}
        </svg>

        <div className={styles.axisLabels}>
          <span className={styles.axisLabel}>Points per snapshot</span>
          <span className={`${styles.axisLabel} ${styles.brand}`}>PLAA balance</span>
        </div>

        <div className={styles.divider} />

        <h4 className={styles.historyTitle}>Contribution History</h4>
        <p className={styles.historySubtitle}>Every closed snapshot since you joined.</p>

        <div className={styles.tableWrap}>
          <div className={styles.bracketRow}>
            <span />
            <span />
            <span className={styles.bracketLabel}>
              PLAA
              <span className={styles.bracketLine} />
            </span>
          </div>
          <div className={styles.headerRow}>
            <span>Snapshot</span>
            <span>Points</span>
            <span>Activities</span>
            <span>Infra rewards</span>
            <span>Redeemed</span>
            <span className={styles.brand}>Balance</span>
          </div>

          {entries.map((entry) => (
            <div key={entry.period} className={styles.dataRow}>
              <span className={styles.period}>{entry.period}</span>
              <span className={`${styles.right} ${styles.points}`}>{entry.points.toLocaleString()}</span>
              <span className={`${styles.right} ${styles.secondary}`}>{entry.plaa.toLocaleString()}</span>
              <span className={`${styles.right} ${styles.secondary}`}>{entry.infra.toLocaleString()}</span>
              <span className={`${styles.right} ${styles.tertiary}`}>{entry.redeemed.toLocaleString()}</span>
              <span className={styles.balanceChip}>{entry.cum.toLocaleString()}</span>
            </div>
          ))}

          <div className={styles.footerRow}>
            <span className={styles.footerLabel}>Total to date</span>
            <span className={`${styles.footerValue} ${styles.points}`}>{totalPoints.toLocaleString()}</span>
            <span className={`${styles.footerValue} ${styles.secondary}`}>{totalPlaa.toLocaleString()}</span>
            <span className={`${styles.footerValue} ${styles.secondary}`}>{totalInfra.toLocaleString()}</span>
            <span className={`${styles.footerValue} ${styles.tertiary}`}>{totalRedeemed.toLocaleString()}</span>
            <span className={styles.balanceChip}>{currentBalance === null ? '—' : currentBalance.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
