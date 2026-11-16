'use client';

import { useState } from 'react';

import type { ContributionHistoryEntry } from '@/services/plaa/hooks/useProfileData';

import { niceMax, pickLabelIndices } from './chart-scale';
import chartStyles from './chart.module.css';
import styles from './contribution-profile-tab.module.css';

interface ContributionProfileTabProps {
  entries: ContributionHistoryEntry[];
  currentBalance: number | null;
  totalRedeemed: number | null;
}

const CHART_WIDTH = 720;
const CHART_HEIGHT = 300;
const PLOT_LEFT = 52;
const PLOT_RIGHT = 668;
const PLOT_TOP = 16;
const PLOT_BOTTOM = 240;
const BAR_WIDTH = 40;
const MAX_X_LABELS = 6;

const BAR_PADDING = 8;

const MIN_REDEEMED_SHARE = 0.2;
const MAX_REDEEMED_SHARE = 0.25;

const ACTIVITY_COLOR = '#1b4dff';
const INFRA_COLOR = '#7cb0ff';
const REDEEMED_COLOR = '#f59e0b';
const BALANCE_COLOR = '#7c3aed';

const TOOLTIP_ROW_HEIGHT = 18;
const TOOLTIP_TITLE_OFFSET = 37;

// Matches the wording the rounds dashboard already uses for an open snapshot.
const PENDING_LABEL = 'Pending';

function dashOr(value: number | null): string {
  return value === null ? '—' : value.toLocaleString();
}

function signed(value: number, sign: '+' | '−'): string {
  return value === 0 ? '0' : `${sign}${value.toLocaleString()}`;
}

function signedDashOr(value: number | null, sign: '+' | '−'): string {
  return value === null ? '—' : signed(value, sign);
}

function pointsLabel(points: number, isPending: boolean): string {
  return `${points.toLocaleString()} points${isPending ? ' so far' : ''}`;
}

function usd(amount: number): string {
  return `$${Math.round(amount).toLocaleString()}`;
}

function pricePerPlaa(price: number): string {
  return `$${price.toFixed(2)}`;
}

function redeemedValueLabel(amountUsd: number, price: number, isAverage: boolean): string {
  return `${usd(amountUsd)} at ${isAverage ? 'avg ' : ''}${pricePerPlaa(price)}`;
}

/** Sums what is known: a month with no figure is left out rather than voiding the whole total. */
function sumKnown(
  entries: ContributionHistoryEntry[],
  pick: (e: ContributionHistoryEntry) => number | null,
): number | null {
  let total: number | null = null;
  for (const e of entries) {
    const v = pick(e);
    if (v === null) continue;
    total = (total ?? 0) + v;
  }
  return total;
}

function priceableTotals(entries: ContributionHistoryEntry[]): { usd: number; price: number } | null {
  let usdTotal = 0;
  let plaaTotal = 0;
  for (const entry of entries) {
    if (entry.redeemedUsd === null || entry.redeemed === null) continue;
    usdTotal += entry.redeemedUsd;
    plaaTotal += entry.redeemed;
  }
  if (plaaTotal === 0) return null;
  return { usd: usdTotal, price: usdTotal / plaaTotal };
}

function tooltipRows(entry: ContributionHistoryEntry, hasPointsData: boolean): Array<{ label: string; value: string }> {
  const plaaValue = (amount: number) => (entry.isPending ? PENDING_LABEL : signed(amount, '+'));
  const rows = [
    { label: 'PLAA balance', value: entry.isPending ? PENDING_LABEL : entry.cum.toLocaleString() },
    { label: 'Activities', value: plaaValue(entry.plaa) },
    { label: 'Infra rewards', value: plaaValue(entry.infra) },
    { label: 'Redeemed', value: signedDashOr(entry.redeemed, '−') },
  ];
  if (hasPointsData) rows.push({ label: 'Points collected', value: dashOr(entry.points) });
  return rows;
}

function buildFlowChart(entries: ContributionHistoryEntry[]) {
  const plotWidth = PLOT_RIGHT - PLOT_LEFT;
  const plotHeight = PLOT_BOTTOM - PLOT_TOP;
  const step = plotWidth / entries.length;

  const maxNew = niceMax(Math.max(...entries.map((e) => e.plaa + e.infra), 1));
  const biggestRedemption = Math.max(...entries.map((e) => e.redeemed ?? 0), 0);
  const maxRedeemed = biggestRedemption > 0 ? niceMax(biggestRedemption) : 0;

  const proportionalShare = maxRedeemed === 0 ? 0 : maxRedeemed / (maxNew + maxRedeemed);
  const redeemedShare =
    maxRedeemed === 0 ? 0 : Math.min(Math.max(proportionalShare, MIN_REDEEMED_SHARE), MAX_REDEEMED_SHARE);

  const usableHeight = plotHeight - BAR_PADDING * (maxRedeemed === 0 ? 1 : 2);
  const negativeHeight = usableHeight * redeemedShare;
  const positiveHeight = usableHeight - negativeHeight;
  const zeroY = PLOT_TOP + BAR_PADDING + positiveHeight;
  const plaaScale = positiveHeight / maxNew;
  const redeemedScale = maxRedeemed === 0 ? 0 : negativeHeight / maxRedeemed;

  const centers = entries.map((_, i) => PLOT_LEFT + step * i + step / 2);
  const barWidth = Math.min(BAR_WIDTH, step * 0.6);

  const visible = (value: number, height: number) => (value > 0 ? Math.max(height, 2) : 0);

  const bars = entries.map((e, i) => {
    const activityH = visible(e.plaa, e.plaa * plaaScale);
    const infraH = visible(e.infra, e.infra * plaaScale);
    const redeemedH = visible(e.redeemed ?? 0, (e.redeemed ?? 0) * redeemedScale);
    return {
      x: centers[i] - barWidth / 2,
      w: barWidth,
      activity: { y: zeroY - activityH, h: activityH },
      infra: { y: zeroY - activityH - infraH, h: infraH },
      redeemed: { y: zeroY, h: redeemedH },
      topY: zeroY - activityH - infraH,
    };
  });

  const plaaTicks = [maxNew, maxNew / 2, 0].map((v) => ({
    y: zeroY - v * plaaScale,
    value: v,
    label: Math.round(v).toLocaleString(),
  }));
  if (maxRedeemed > 0) {
    for (const v of [maxRedeemed / 2, maxRedeemed]) {
      plaaTicks.push({ y: zeroY + v * redeemedScale, value: -v, label: `−${Math.round(v).toLocaleString()}` });
    }
  }

  const maxBalance = niceMax(Math.max(...entries.map((e) => e.cum), 1));
  const balanceY = (v: number) => zeroY - (v / maxBalance) * positiveHeight;
  const balanceTicks = [maxBalance, maxBalance / 2].map((v) => ({
    y: balanceY(v),
    label: Math.round(v).toLocaleString(),
  }));
  const balanceDots = entries.map((e, i) => ({ cx: centers[i], cy: balanceY(e.cum) }));
  const balanceLine = balanceDots.map((d) => `${d.cx},${d.cy}`).join(' ');

  const labelIndices = pickLabelIndices(entries.length, MAX_X_LABELS);
  const labels = entries.map((e, i) => ({ x: centers[i], period: e.period, i })).filter(({ i }) => labelIndices.has(i));
  const hoverZones = entries.map((_, i) => ({ x: centers[i] - step / 2, w: step }));

  return { bars, plaaTicks, balanceTicks, balanceLine, balanceDots, labels, hoverZones, zeroY };
}

export default function ContributionProfileTab({
  entries,
  currentBalance,
  totalRedeemed,
}: ContributionProfileTabProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (entries.length === 0) {
    return (
      <div className={styles.card}>
        <p className={styles.historySubtitle}>No snapshot history yet.</p>
      </div>
    );
  }

  const hasPointsData = entries.some((e) => e.points !== null);
  const hasRedemptions = entries.some((e) => (e.redeemed ?? 0) > 0);
  const chart = buildFlowChart(entries);

  const newestFirst = [...entries].reverse();

  const totalPoints = sumKnown(entries, (e) => e.points);
  const redeemedTotals = priceableTotals(entries);
  // An open snapshot's PLAA is not final, so it stays out of the totals until it closes.
  const closedEntries = entries.filter((e) => !e.isPending);
  const totalPlaa = closedEntries.reduce((sum, p) => sum + p.plaa, 0);
  const totalInfra = closedEntries.reduce((sum, p) => sum + p.infra, 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
      <div className={styles.card}>
        <div className={chartStyles.chartHeader}>
          <div>
            <h3 className={chartStyles.chartTitle}>PLAA balance</h3>
            <p className={chartStyles.chartSubtitle}>
              What each snapshot added, split between activities and infra rewards, with buyback redemptions below the
              line and the balance they left on top.
            </p>
          </div>
          <div className={chartStyles.legend}>
            <span className={chartStyles.legendItem}>
              <span className={chartStyles.legendSwatch} style={{ background: ACTIVITY_COLOR }} />
              Activities
            </span>
            <span className={chartStyles.legendItem}>
              <span className={chartStyles.legendSwatch} style={{ background: INFRA_COLOR }} />
              Infra rewards
            </span>
            <span className={chartStyles.legendItem}>
              <span className={chartStyles.legendSwatch} style={{ background: REDEEMED_COLOR }} />
              Redeemed in buybacks
            </span>
            <span className={chartStyles.legendItem}>
              <span className={chartStyles.legendSwatchLine} style={{ background: BALANCE_COLOR }} />
              PLAA balance
            </span>
          </div>
        </div>

        <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className={chartStyles.chart}>
          {chart.plaaTicks.map((t, i) => (
            <line key={i} x1={PLOT_LEFT} y1={t.y} x2={PLOT_RIGHT} y2={t.y} stroke="#f1f5f9" strokeWidth="1" />
          ))}
          {chart.plaaTicks.map((t, i) => (
            <text key={i} x={PLOT_RIGHT + 10} y={t.y + 4} textAnchor="start" fontSize="10" fill="#156ff7">
              {t.label}
            </text>
          ))}
          {chart.balanceTicks.map((t, i) => (
            <text key={i} x={PLOT_LEFT - 10} y={t.y + 4} textAnchor="end" fontSize="10" fill={BALANCE_COLOR}>
              {t.label}
            </text>
          ))}

          {chart.bars.map((b, i) => (
            <g key={i}>
              <rect x={b.x} y={b.activity.y} width={b.w} height={b.activity.h} rx="2" fill={ACTIVITY_COLOR} />
              <rect x={b.x} y={b.infra.y} width={b.w} height={b.infra.h} rx="2" fill={INFRA_COLOR} />
              {b.redeemed.h > 0 && (
                <rect x={b.x} y={b.redeemed.y} width={b.w} height={b.redeemed.h} rx="2" fill={REDEEMED_COLOR} />
              )}
            </g>
          ))}

          <line x1={PLOT_LEFT} y1={chart.zeroY} x2={PLOT_RIGHT} y2={chart.zeroY} stroke="#cbd5e1" strokeWidth="1.5" />

          <polyline
            points={chart.balanceLine}
            fill="none"
            stroke={BALANCE_COLOR}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {chart.balanceDots.map((d, i) => (
            <circle key={i} cx={d.cx} cy={d.cy} r="4" fill="#fff" stroke={BALANCE_COLOR} strokeWidth="2.5" />
          ))}

          {chart.labels.map((l, i) => (
            <text key={i} x={l.x} y={PLOT_BOTTOM + 24} textAnchor="middle" fontSize="11" fill="#94a3b8">
              {l.period}
            </text>
          ))}

          {hoveredIndex !== null &&
            (() => {
              const entry = entries[hoveredIndex];
              const bar = chart.bars[hoveredIndex];
              const rows = tooltipRows(entry, hasPointsData);
              const boxW = 172;
              const boxH = TOOLTIP_TITLE_OFFSET + rows.length * TOOLTIP_ROW_HEIGHT + 10;
              const boxX = Math.min(Math.max(bar.x + bar.w / 2 - boxW / 2, PLOT_LEFT), PLOT_RIGHT - boxW);
              const above = bar.topY - boxH - 12;
              const boxY = above >= PLOT_TOP ? above : Math.min(bar.topY + 12, PLOT_BOTTOM - boxH);
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

        <div className={chartStyles.axisLabels}>
          <span className={chartStyles.axisLabel}>PLAA balance</span>
          <span className={`${chartStyles.axisLabel} ${chartStyles.brand}`}>
            {hasRedemptions ? 'New PLAA / redeemed' : 'New PLAA'}
          </span>
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
                <span>{entry.isPending ? PENDING_LABEL : signed(entry.plaa, '+')}</span>
                {entry.points !== null && (
                  <span className={styles.pointsLine}>{pointsLabel(entry.points, entry.isPending)}</span>
                )}
              </span>
              <span className={`${styles.right} ${styles.secondary}`}>
                {entry.isPending ? PENDING_LABEL : signed(entry.infra, '+')}
              </span>
              <span className={`${styles.right} ${styles.stackedCell} ${styles.tertiary}`}>
                <span>{signedDashOr(entry.redeemed, '−')}</span>
                {entry.redeemedUsd !== null && entry.redeemedPrice !== null && (
                  <span className={styles.usdLine}>
                    {redeemedValueLabel(entry.redeemedUsd, entry.redeemedPrice, entry.redeemedPriceIsAverage)}
                  </span>
                )}
              </span>
              <span className={styles.balanceChip}>{entry.isPending ? PENDING_LABEL : entry.cum.toLocaleString()}</span>
            </div>
          ))}

          <div className={styles.footerRow}>
            <span className={styles.footerLabel}>Total to date</span>
            <span className={`${styles.footerValue} ${styles.stackedCell} ${styles.secondary}`}>
              <span>{signed(totalPlaa, '+')}</span>
              {totalPoints !== null && <span className={styles.pointsLine}>{pointsLabel(totalPoints, false)}</span>}
            </span>
            <span className={`${styles.footerValue} ${styles.secondary}`}>{signed(totalInfra, '+')}</span>
            <span className={`${styles.footerValue} ${styles.stackedCell} ${styles.tertiary}`}>
              <span>{signedDashOr(totalRedeemed, '−')}</span>
              {redeemedTotals !== null && (
                <span className={styles.usdLine}>
                  {usd(redeemedTotals.usd)} &middot; avg {pricePerPlaa(redeemedTotals.price)}
                </span>
              )}
            </span>
            <span className={styles.balanceChip}>
              {currentBalance === null ? '—' : currentBalance.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
