'use client';

import type { NavPoint } from '@/services/plaa/trust-holdings.service';

interface NavAreaChartProps {
  readonly points: NavPoint[];
  readonly gradientId: string;
  /** Which figure on each NavPoint to plot. */
  readonly field: 'navPerPlaa' | 'nav';
  readonly height?: number;
  readonly showAxisLabels?: boolean;
}

const VIEW_W = 700;
const VIEW_H = 196;
const PAD_L = 62;
const PAD_R = 56;
const PAD_T = 18;
const PAD_B = 34;

/**
 * Area chart over the live monthly NAV series. The prototype hard-codes an SVG
 * path; every coordinate here is computed from the points passed in, so the
 * curve is whatever the backend reports.
 */
export default function NavAreaChart({
  points,
  gradientId,
  field,
  height,
  showAxisLabels = true,
}: NavAreaChartProps) {
  if (points.length < 2) return null;

  const values = points.map((p) => p[field]);
  const max = Math.max(...values);
  const min = Math.min(...values);
  // A flat series would divide by zero; fall back to a band around the value.
  const span = max - min || Math.abs(max) || 1;
  const top = max + span * 0.12;
  const bottom = min - span * 0.12;

  const x = (i: number) => PAD_L + (i * (VIEW_W - PAD_L - PAD_R)) / (points.length - 1);
  const y = (v: number) => PAD_T + ((top - v) / (top - bottom)) * (VIEW_H - PAD_T - PAD_B);

  const line = points.map((p, i) => `${x(i).toFixed(1)},${y(p[field]).toFixed(1)}`).join(' ');
  const baseline = y(bottom);
  const area = `${x(0).toFixed(1)},${baseline.toFixed(1)} ${line} ${x(points.length - 1).toFixed(1)},${baseline.toFixed(1)}`;

  const gridLines = [0.25, 0.5, 0.75].map((f) => PAD_T + f * (VIEW_H - PAD_T - PAD_B));
  const last = points[points.length - 1];

  const format = (v: number) => (field === 'navPerPlaa' ? `$${v.toFixed(2)}` : `$${(v / 1_000_000).toFixed(2)}M`);

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} style={{ width: '100%', height: height ? `${height}px` : 'auto', display: 'block' }} role="img" aria-label="NAV history">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-chart)" stopOpacity="0.16" />
          <stop offset="100%" stopColor="var(--color-chart)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {gridLines.map((gy) => (
        <line key={`grid-${gy}`} x1={PAD_L} x2={VIEW_W - PAD_R} y1={gy} y2={gy} stroke="var(--border-faint)" strokeWidth="1" />
      ))}

      <polygon points={area} fill={`url(#${gradientId})`} />
      <polyline
        points={line}
        fill="none"
        stroke="var(--color-chart)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={x(points.length - 1)} cy={y(last[field])} r="5" fill="var(--color-chart)" stroke="#fff" strokeWidth="2" />

      {showAxisLabels && (
        <>
          <text x={PAD_L - 10} y={y(max) + 4} textAnchor="end" fill="var(--text-tertiary)" style={{ fontSize: '10px', fontWeight: 500 }}>
            {format(max)}
          </text>
          <text x={PAD_L - 10} y={y(min) + 4} textAnchor="end" fill="var(--text-tertiary)" style={{ fontSize: '10px', fontWeight: 500 }}>
            {format(min)}
          </text>
          <text x={PAD_L} y={VIEW_H - 8} textAnchor="start" fill="var(--text-tertiary)" style={{ fontSize: '10px', fontWeight: 500 }}>
            {points[0].label}
          </text>
          <text x={VIEW_W - PAD_R} y={VIEW_H - 8} textAnchor="end" fill="var(--text-tertiary)" style={{ fontSize: '10px', fontWeight: 500 }}>
            {last.label}
          </text>
        </>
      )}
    </svg>
  );
}
