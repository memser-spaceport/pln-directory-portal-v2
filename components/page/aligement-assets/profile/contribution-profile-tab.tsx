'use client';

import { useState } from 'react';

import type { ContributionHistoryEntry } from '@/services/plaa/hooks/useProfileData';

import styles from './contribution-profile-tab.module.css';

interface ContributionProfileTabProps {
  entries: ContributionHistoryEntry[];
  currentBalance: number | null;
  totalRedeemed: number | null;
}

const CHART_WIDTH = 720;
const CHART_HEIGHT = 268;
const PLOT_LEFT = 52;
const PLOT_RIGHT = 668;
const PLOT_TOP = 16;
const PLOT_BOTTOM = 210;
const BAR_WIDTH = 40;
const GRID_LINES = 5;

// Matches the wording the rounds dashboard already uses for an open snapshot.
const PENDING_LABEL = 'Pending';

function dashOr(value: number | null): string {
  return value === null ? '—' : value.toLocaleString();
}

/**
 * Points sit under the PLAA they produced rather than in a column of their own:
 * they are the input, not a second currency. An open snapshot says "so far",
 * since its count is still rising.
 */
function pointsLabel(points: number, isPending: boolean): string {
  return `${points.toLocaleString()} points${isPending ? ' so far' : ''}`;
}

/** Sums what is known: a month with no figure is left out rather than voiding the whole total. */
function sumKnown(entries: ContributionHistoryEntry[], pick: (e: ContributionHistoryEntry) => number | null): number | null {
  let total: number | null = null;
  for (const e of entries) {
    const v = pick(e);
    if (v === null) continue;
    total = (total ?? 0) + v;
  }
  return total;
}

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / magnitude) * magnitude;
}

const MAX_X_LABELS = 6;

const TOOLTIP_ROW_HEIGHT = 18;
const TOOLTIP_TITLE_OFFSET = 37;

/**
 * What the hover card lists, balance first: the line being hovered is the
 * balance, and the rows under it explain how it moved.
 */
function tooltipRows(entry: ContributionHistoryEntry, hasPointsData: boolean): Array<{ label: string; value: string }> {
  // An open snapshot's PLAA is provisional, so its figures read Pending here
  // exactly as they do in the table below.
  const plaaValue = (amount: number) => (entry.isPending ? PENDING_LABEL : amount.toLocaleString());
  const rows = [
    { label: 'PLAA balance', value: plaaValue(entry.cum) },
    // Everything the balance gained this snapshot: activities plus infra rewards.
    { label: 'New PLAA', value: plaaValue(entry.plaa + entry.infra) },
    { label: 'PLAA redeemed', value: dashOr(entry.redeemed) },
  ];
  if (hasPointsData) rows.push({ label: 'Points collected', value: dashOr(entry.points) });
  return rows;
}

function pickLabelIndices(length: number, maxLabels: number): Set<number> {
  if (length <= maxLabels) return new Set(Array.from({ length }, (_, i) => i));
  const indices = new Set<number>();
  for (let i = 0; i < maxLabels; i++) {
    indices.add(Math.round((i * (length - 1)) / (maxLabels - 1)));
  }
  return indices;
}

function buildChart(entries: ContributionHistoryEntry[], hasPointsData: boolean) {
  const maxBalance = niceMax(Math.max(...entries.map((e) => e.cum), 1));
  const plotWidth = PLOT_RIGHT - PLOT_LEFT;
  const plotHeight = PLOT_BOTTOM - PLOT_TOP;
  const step = plotWidth / entries.length;

  const grid = Array.from({ length: GRID_LINES }, (_, i) => PLOT_TOP + (plotHeight / (GRID_LINES - 1)) * i);
  const rightAxisTicks = grid.map((y, i) => ({ y, label: Math.round((maxBalance * (GRID_LINES - 1 - i)) / (GRID_LINES - 1)) }));

  const centers = entries.map((_, i) => PLOT_LEFT + step * i + step / 2);
  const labelIndices = pickLabelIndices(entries.length, MAX_X_LABELS);

  const barWidth = Math.min(BAR_WIDTH, step * 0.6);

  let bars: Array<{ x: number; y: number; w: number; h: number; value: number }> = [];
  let leftAxisTicks: Array<{ y: number; label: number }> = [];
  if (hasPointsData) {
    const maxPoints = niceMax(Math.max(...entries.map((e) => e.points ?? 0), 1));
    leftAxisTicks = grid.map((y, i) => ({ y, label: Math.round((maxPoints * (GRID_LINES - 1 - i)) / (GRID_LINES - 1)) }));
    bars = entries.map((e, i) => {
      const h = ((e.points ?? 0) / maxPoints) * plotHeight;
      return { x: centers[i] - barWidth / 2, y: PLOT_BOTTOM - h, w: barWidth, h, value: e.points ?? 0 };
    });
  }

  const dots = entries.map((e, i) => ({
    cx: centers[i],
    cy: PLOT_BOTTOM - (e.cum / maxBalance) * plotHeight,
  }));

  const line = dots.map((d) => `${d.cx},${d.cy}`).join(' ');
  const labels = entries
    .map((e, i) => ({ x: centers[i], period: e.period, i }))
    .filter(({ i }) => labelIndices.has(i));
  const hoverZones = entries.map((e, i) => ({ x: centers[i] - step / 2, w: step, balance: e.cum }));

  return { grid, bars, dots, line, labels, leftAxisTicks, rightAxisTicks, hoverZones };
}

export default function ContributionProfileTab({ entries, currentBalance, totalRedeemed }: ContributionProfileTabProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (entries.length === 0) {
    return (
      <div className={styles.card}>
        <p className={styles.historySubtitle}>No snapshot history yet.</p>
      </div>
    );
  }

  const hasPointsData = entries.some((e) => e.points !== null);
  const chart = buildChart(entries, hasPointsData);

  // The chart reads left to right from the oldest period; the table leads with
  // the newest, which is the one a member came to look at.
  const newestFirst = [...entries].reverse();

  const totalPoints = sumKnown(entries, (e) => e.points);
  // An open snapshot's PLAA is not final, so it stays out of the totals until it closes.
  const closedEntries = entries.filter((e) => !e.isPending);
  const totalPlaa = closedEntries.reduce((sum, p) => sum + p.plaa, 0);
  const totalInfra = closedEntries.reduce((sum, p) => sum + p.infra, 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
      <div className={styles.card}>
        <div className={styles.chartHeader}>
          <div>
            <h3 className={styles.chartTitle}>
              {hasPointsData ? 'Points and PLAA balance over time' : 'PLAA balance over time'}
            </h3>
            <p className={styles.chartSubtitle}>
              {hasPointsData
                ? 'Points collected in each snapshot, and your PLAA balance after redemptions.'
                : 'Your PLAA balance after redemptions.'}
            </p>
          </div>
          <div className={styles.legend}>
            {hasPointsData && (
              <span className={styles.legendItem}>
                <span className={styles.legendSwatchBar} />
                Points collected
              </span>
            )}
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
          {hoveredIndex !== null && (() => {
            const entry = entries[hoveredIndex];
            const dot = chart.dots[hoveredIndex];
            const rows = tooltipRows(entry, hasPointsData);
            const boxW = 172;
            const boxH = TOOLTIP_TITLE_OFFSET + rows.length * TOOLTIP_ROW_HEIGHT + 10;
            const boxX = Math.min(Math.max(dot.cx - boxW / 2, PLOT_LEFT), PLOT_RIGHT - boxW);
            // Above the dot where there is room, below it near the top edge, so a
            // high balance point does not sit under its own tooltip.
            const above = dot.cy - boxH - 14;
            const boxY = above >= PLOT_TOP ? above : Math.min(dot.cy + 14, PLOT_BOTTOM - boxH);
            return (
              <g style={{ pointerEvents: 'none' }}>
                <rect x={boxX} y={boxY} width={boxW} height={boxH} rx="8" fill="#156ff7" />
                <text x={boxX + 12} y={boxY + 19} textAnchor="start" fontSize="11" fontWeight="700" fill="#ffffff">
                  {entry.period}
                </text>
                {rows.map((row, i) => (
                  <text
                    key={row.label}
                    x={boxX + 12}
                    y={boxY + TOOLTIP_TITLE_OFFSET + i * TOOLTIP_ROW_HEIGHT}
                    textAnchor="start"
                    fontSize="10"
                    fill="#dbeafe"
                  >
                    {row.label}: {row.value}
                  </text>
                ))}
              </g>
            );
          })()}
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
          {hasPointsData && <span className={styles.axisLabel}>Points per snapshot</span>}
          <span className={`${styles.axisLabel} ${styles.brand}`}>PLAA balance</span>
        </div>

        <div className={styles.divider} />

        <h4 className={styles.historyTitle}>Contribution History</h4>
        <p className={styles.historySubtitle}>Every snapshot since you joined.</p>

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
            <span>Activities</span>
            <span>Infra rewards</span>
            <span>Redeemed</span>
            <span className={styles.brand}>Balance</span>
          </div>

          {newestFirst.map((entry) => (
            <div key={entry.period} className={styles.dataRow}>
              <span className={styles.period}>{entry.period}</span>
              <span className={`${styles.right} ${styles.stackedCell} ${styles.secondary}`}>
                <span>{entry.isPending ? PENDING_LABEL : entry.plaa.toLocaleString()}</span>
                {entry.points !== null && (
                  <span className={styles.pointsLine}>{pointsLabel(entry.points, entry.isPending)}</span>
                )}
              </span>
              <span className={`${styles.right} ${styles.secondary}`}>
                {entry.isPending ? PENDING_LABEL : entry.infra.toLocaleString()}
              </span>
              <span className={`${styles.right} ${styles.tertiary}`}>{dashOr(entry.redeemed)}</span>
              <span className={styles.balanceChip}>{entry.isPending ? PENDING_LABEL : entry.cum.toLocaleString()}</span>
            </div>
          ))}

          <div className={styles.footerRow}>
            <span className={styles.footerLabel}>Total to date</span>
            <span className={`${styles.footerValue} ${styles.stackedCell} ${styles.secondary}`}>
              <span>{totalPlaa.toLocaleString()}</span>
              {totalPoints !== null && <span className={styles.pointsLine}>{pointsLabel(totalPoints, false)}</span>}
            </span>
            <span className={`${styles.footerValue} ${styles.secondary}`}>{totalInfra.toLocaleString()}</span>
            <span className={`${styles.footerValue} ${styles.tertiary}`}>{dashOr(totalRedeemed)}</span>
            <span className={styles.balanceChip}>{currentBalance === null ? '—' : currentBalance.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
