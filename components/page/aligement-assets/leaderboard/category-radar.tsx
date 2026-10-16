'use client';

import { UNDERUTILIZED_RATIO } from './leaderboard.mapper';
import { useTweenedValues } from './use-tweened-values';

const CX = 160;
const CY = 150;
const R = 96;
const GRID_RINGS = [0.25, 0.5, 0.75, 1];
// One dot size for both series; underutilized categories are marked by the star on their label.
const DOT_RADIUS = 3.5;
// PLAA takes the top banner's teal; points use a lighter teal so the two series differ in lightness.
export const PLAA_SERIES_COLOR = '#0c5259';
const PLAA_SERIES_FILL = 'rgba(12, 82, 89, 0.16)';
export const POINTS_SERIES_COLOR = '#3E97AB';
const POINTS_SERIES_FILL = 'rgba(62, 151, 171, 0.16)';

interface CategoryRadarProps {
  /** `value` = points collected, `plaa` = PLAA distributed. */
  readonly categories: Array<{ name: string; value: number; plaa?: number }>;
  /** Draw the PLAA distributed shape. Off while a live snapshot hasn't converted yet. */
  readonly showPlaa?: boolean;
  /** Category highlighted from either side of the panel. */
  readonly activeCategory?: string | null;
  readonly onCategoryHover?: (name: string | null) => void;
}

const splitLabel = (name: string): [string, string] => {
  const parts = name.split(/\s*\/\s*|\s+/);
  if (name.length <= 12 || parts.length < 2) return [name, ''];
  if (name.includes('/')) {
    const slash = name.indexOf('/');
    return [name.slice(0, slash + 1), name.slice(slash + 1).trim()];
  }
  return [parts[0], parts.slice(1).join(' ')];
};

export default function CategoryRadar({
  categories,
  showPlaa = false,
  activeCategory = null,
  onCategoryHover,
}: CategoryRadarProps) {
  const max = Math.max(...categories.map((category) => category.value), 0);
  // Each series is scaled to its own largest category, so the two shapes compare by proportion.
  const maxPlaa = Math.max(...categories.map((category) => category.plaa ?? 0), 0);
  const plaaVisible = showPlaa && maxPlaa > 0;

  // Moving between snapshots morphs both shapes from the old values to the new ones; the PLAA
  // shape grows in or fades out when a snapshot has or hasn't converted yet.
  const count = categories.length;
  const tweened = useTweenedValues([
    ...categories.map((category) => (max > 0 ? category.value / max : 0)),
    ...categories.map((category) => (plaaVisible ? (category.plaa ?? 0) / maxPlaa : 0)),
    plaaVisible ? 1 : 0,
  ]);
  const pointsRatios = tweened.slice(0, count);
  const plaaRatios = tweened.slice(count, count * 2);
  const plaaOpacity = tweened[count * 2] ?? 0;

  const step = (2 * Math.PI) / Math.max(count, 1);
  const angle = (index: number) => -Math.PI / 2 + index * step;
  const point = (index: number, radius: number): [number, number] => [
    CX + radius * Math.cos(angle(index)),
    CY + radius * Math.sin(angle(index)),
  ];
  const ring = (radius: number, ratios?: number[]) =>
    categories
      .map((_, index) => {
        const [x, y] = point(index, radius * (ratios ? ratios[index] : 1));
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

  const threshold = max * UNDERUTILIZED_RATIO;
  const isActive = (name: string) => activeCategory === name;
  const isDimmed = (name: string) => activeCategory != null && activeCategory !== name;
  const dotRadius = (name: string) => (isActive(name) ? DOT_RADIUS + 1.5 : DOT_RADIUS);

  // A wedge around each spoke, reaching past its label, so hovering anywhere near a category picks it.
  const wedge = (index: number) => {
    const reach = R + 48;
    const from = angle(index) - step / 2;
    const to = angle(index) + step / 2;
    const at = (a: number) => `${(CX + reach * Math.cos(a)).toFixed(1)},${(CY + reach * Math.sin(a)).toFixed(1)}`;
    return `M${CX},${CY} L${at(from)} A${reach},${reach} 0 0 1 ${at(to)} Z`;
  };

  return (
    <svg
      viewBox="0 0 320 300"
      className="lb-radar"
      role="img"
      aria-label={
        showPlaa
          ? 'Points collected and PLAA distributed per activity category'
          : 'Points collected per activity category'
      }
    >
      {GRID_RINGS.map((factor) => (
        <polygon key={factor} points={ring(R * factor)} fill="none" stroke="var(--border-subtle)" strokeWidth="1" />
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
            stroke={isActive(category.name) ? 'var(--color-brand-text)' : 'var(--border-subtle)'}
            strokeWidth={isActive(category.name) ? 1.5 : 1}
          />
        );
      })}

      <polygon
        points={ring(R, pointsRatios)}
        fill={POINTS_SERIES_FILL}
        stroke={POINTS_SERIES_COLOR}
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {plaaOpacity > 0.01 && (
        <g opacity={plaaOpacity}>
          <polygon
            points={ring(R, plaaRatios)}
            fill={PLAA_SERIES_FILL}
            stroke={PLAA_SERIES_COLOR}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {categories.map((category, index) => {
            const [x, y] = point(index, R * plaaRatios[index]);
            return (
              <circle
                key={`plaa-${category.name}`}
                cx={x.toFixed(1)}
                cy={y.toFixed(1)}
                r={dotRadius(category.name)}
                fill={PLAA_SERIES_COLOR}
                stroke="#fff"
                strokeWidth="1.5"
              />
            );
          })}
        </g>
      )}

      {categories.map((category, index) => {
        const [x, y] = point(index, R * pointsRatios[index]);
        return (
          <circle
            key={`dot-${category.name}`}
            cx={x.toFixed(1)}
            cy={y.toFixed(1)}
            r={dotRadius(category.name)}
            fill={POINTS_SERIES_COLOR}
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
        // Same colours as the category names in the conversion bars beside the radar.
        const fill = under ? 'var(--color-brand-text)' : 'var(--text-primary)';
        return (
          <g key={`label-${category.name}`} className="lb-radar-label" opacity={isDimmed(category.name) ? 0.4 : 1}>
            {under && (
              <text
                x={x.toFixed(1)}
                y={(y1 - 13).toFixed(1)}
                textAnchor={anchor}
                fill="var(--color-brand-text)"
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

      {onCategoryHover &&
        categories.map((category, index) => (
          <path
            key={`hover-${category.name}`}
            d={wedge(index)}
            fill="transparent"
            onMouseEnter={() => onCategoryHover(category.name)}
            onMouseLeave={() => onCategoryHover(null)}
          />
        ))}

      <style jsx>{`
        .lb-radar {
          width: 100%;
          height: auto;
          overflow: visible;
        }
        .lb-radar :global(.lb-radar-label) {
          transition: opacity 150ms ease;
        }
      `}</style>
    </svg>
  );
}
