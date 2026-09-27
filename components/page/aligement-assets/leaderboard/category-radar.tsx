'use client';

import { UNDERUTILIZED_RATIO } from './leaderboard.mapper';

/** Geometry from the design prototype. */
const CX = 160;
const CY = 150;
const R = 96;
const GRID_RINGS = [0.25, 0.5, 0.75, 1];

interface CategoryRadarProps {
  /** Live points per category this snapshot (stats.chart) — any length. */
  readonly categories: Array<{ name: string; value: number }>;
}

/**
 * Splits the long category names onto two lines, as the design does.
 * The break is cosmetic only — the API's own spelling is preserved, so a
 * category reads identically here and in the boost cards below (the API says
 * "People/Talent", not the design's "People / Talent").
 */
const splitLabel = (name: string): [string, string] => {
  const parts = name.split(/\s*\/\s*|\s+/);
  if (name.length <= 12 || parts.length < 2) return [name, ''];
  if (name.includes('/')) {
    const slash = name.indexOf('/');
    return [name.slice(0, slash + 1), name.slice(slash + 1).trim()];
  }
  return [parts[0], parts.slice(1).join(' ')];
};

export default function CategoryRadar({ categories }: CategoryRadarProps) {
  // Scaled to the busiest live category, not the prototype's fixed 340.
  const max = Math.max(...categories.map((category) => category.value), 0);
  const step = (2 * Math.PI) / Math.max(categories.length, 1);
  const angle = (index: number) => -Math.PI / 2 + index * step;
  const point = (index: number, radius: number): [number, number] => [
    CX + radius * Math.cos(angle(index)),
    CY + radius * Math.sin(angle(index)),
  ];
  const ring = (radius: number, scaled: boolean) =>
    categories
      .map((category, index) => {
        const ratio = scaled && max > 0 ? category.value / max : 1;
        const [x, y] = point(index, radius * ratio);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

  const threshold = max * UNDERUTILIZED_RATIO;

  return (
    <svg viewBox="0 0 320 300" className="lb-radar" role="img" aria-label="Points collected per activity category">
      <defs>
        <linearGradient id="lbGold" x1="0" y1="0" x2="1" y2="0">
          {/* Underutilised highlight: the PLAA primary, not green, so the
              callout reads as part of the page rather than a status colour. */}
          <stop offset="0%" stopColor="#12708F" />
          <stop offset="100%" stopColor="#0B4F66" />
        </linearGradient>
      </defs>

      {GRID_RINGS.map((factor) => (
        <polygon key={factor} points={ring(R * factor, false)} fill="none" stroke="var(--border-subtle)" strokeWidth="1" />
      ))}

      {categories.map((category, index) => {
        const [x, y] = point(index, R);
        return (
          <line
            key={`axis-${category.name}`}
            x1={CX}
            y1={CY}
            x2={x.toFixed(1)}
            y2={y.toFixed(1)}
            stroke="var(--border-subtle)"
            strokeWidth="1"
          />
        );
      })}

      <polygon
        points={ring(R, true)}
        /* Brand, not --color-chart: this plots activity categories, not the
           Trust's holdings, so it follows the PLAA primary. The NAV series and
           the portfolio charts stay on --color-chart. */
        fill="rgba(11, 79, 102, 0.16)"
        stroke="var(--color-brand)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {categories.map((category, index) => {
        const ratio = max > 0 ? category.value / max : 0;
        const [x, y] = point(index, R * ratio);
        const under = category.value < threshold;
        return (
          <circle
            key={`dot-${category.name}`}
            cx={x.toFixed(1)}
            cy={y.toFixed(1)}
            r={under ? 5 : 3.5}
            fill={under ? '#12708F' : 'var(--color-brand)'}
            stroke="#fff"
            strokeWidth="1.5"
          />
        );
      })}

      {categories.map((category, index) => {
        const [x, y] = point(index, R + 18);
        const anchor = x < CX - 2 ? 'end' : x > CX + 2 ? 'start' : 'middle';
        const [line1, line2] = splitLabel(category.name);
        const under = category.value < threshold;
        const above = y < CY - 20;
        const y1 = !line2 ? y + 4 : above ? y - 3 : y + 4;
        const y2 = above ? y + 9 : y + 16;
        const fill = under ? 'url(#lbGold)' : 'var(--text-secondary)';
        return (
          <g key={`label-${category.name}`}>
            {under && (
              <text
                x={x.toFixed(1)}
                y={(y1 - 13).toFixed(1)}
                textAnchor={anchor}
                fill="#12708F"
                style={{ fontWeight: 700, fontSize: '12px' }}
              >
                ★
              </text>
            )}
            <text
              x={x.toFixed(1)}
              y={y1.toFixed(1)}
              textAnchor={anchor}
              fill={fill}
              style={{ fontWeight: under ? 700 : 600, fontSize: '11px' }}
            >
              {line1}
            </text>
            {line2 && (
              <text
                x={x.toFixed(1)}
                y={y2.toFixed(1)}
                textAnchor={anchor}
                fill={fill}
                style={{ fontWeight: under ? 700 : 600, fontSize: '11px' }}
              >
                {line2}
              </text>
            )}
          </g>
        );
      })}

      <style jsx>{`
        .lb-radar {
          width: 100%;
          height: auto;
          overflow: visible;
        }
      `}</style>
    </svg>
  );
}
