'use client';

import { Star } from '@phosphor-icons/react';
import { PLAA_SERIES_COLOR, POINTS_SERIES_COLOR } from './category-radar';
import { isUnderutilized } from './leaderboard.mapper';

interface ConversionBarsProps {
  /** `value` = points collected, `plaa` = PLAA distributed. Same order as the radar. */
  readonly categories: Array<{ name: string; value: number; plaa: number }>;
  /** Category highlighted from either side of the panel. */
  readonly activeCategory?: string | null;
  readonly onCategoryHover?: (name: string | null) => void;
}

const formatWhole = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 0 });

/**
 * How each category's points converted into PLAA for a closed snapshot. Each bar is scaled to
 * its own largest category, matching the radar, so a short points bar next to a long PLAA bar
 * shows a category that paid out more per point.
 */
export default function ConversionBars({ categories, activeCategory = null, onCategoryHover }: ConversionBarsProps) {
  const maxPoints = Math.max(...categories.map((category) => category.value), 0);
  const maxPlaa = Math.max(...categories.map((category) => category.plaa), 0);
  const share = (value: number, max: number) => (max > 0 ? (value / max) * 100 : 0);

  return (
    <div className="lb-conv">
      <div className="lb-conv-head">
        <span>Category</span>
        <span>PLAA distributed</span>
      </div>
      {categories.map((category) => {
        const under = isUnderutilized(category.value, maxPoints);
        return (
          <div
            key={category.name}
            className={`lb-conv-row${
              activeCategory == null
                ? ''
                : activeCategory === category.name
                  ? ' lb-conv-row--active'
                  : ' lb-conv-row--dim'
            }`}
            onMouseEnter={() => onCategoryHover?.(category.name)}
            onMouseLeave={() => onCategoryHover?.(null)}
          >
            <div className="lb-conv-row-head">
              <span className={`lb-conv-name${under ? ' lb-conv-name--under' : ''}`}>
                {under && <Star weight="fill" size={12} color="var(--color-brand-text)" aria-label="Underutilized" />}
                {category.name}
              </span>
              <span className="lb-conv-plaa">
                {formatWhole(category.plaa)} <span className="lb-conv-unit">PLAA</span>
              </span>
            </div>
            <div className="lb-conv-bars" aria-hidden="true">
              <div className="lb-conv-track">
                <div
                  className="lb-conv-fill lb-conv-fill--points"
                  style={{ width: `${share(category.value, maxPoints)}%` }}
                />
              </div>
              <div className="lb-conv-track">
                <div
                  className="lb-conv-fill lb-conv-fill--plaa"
                  style={{ width: `${share(category.plaa, maxPlaa)}%` }}
                />
              </div>
            </div>
            <div className="lb-conv-points">{formatWhole(category.value)} points</div>
          </div>
        );
      })}

      <style jsx>{`
        .lb-conv {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .lb-conv-head {
          display: flex;
          justify-content: space-between;
          font: var(--text-label-sm);
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-tertiary);
        }
        .lb-conv-row {
          display: flex;
          flex-direction: column;
          gap: 7px;
          border-radius: var(--radius-md);
          transition:
            opacity 150ms ease,
            background 150ms ease,
            box-shadow 150ms ease;
        }
        /* The spread shadow paints the highlight past the row's edges without shifting the layout. */
        .lb-conv-row--active {
          background: rgba(12, 82, 89, 0.07);
          box-shadow: 0 0 0 8px rgba(12, 82, 89, 0.07);
        }
        .lb-conv-row--dim {
          opacity: 0.45;
        }
        .lb-conv-row-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 12px;
        }
        .lb-conv-name {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font: var(--text-label-lg);
          font-weight: 600;
          color: var(--text-primary);
        }
        .lb-conv-name--under {
          color: var(--color-brand-text);
          font-weight: 700;
        }
        .lb-conv-plaa {
          font: var(--text-label-lg);
          font-weight: 600;
          color: var(--text-primary);
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }
        .lb-conv-unit {
          font: var(--text-label-md);
          color: var(--text-secondary);
        }
        .lb-conv-bars {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .lb-conv-track {
          height: 5px;
          border-radius: 999px;
          background: var(--surface-page);
          box-shadow: var(--ring-hairline);
          overflow: hidden;
        }
        .lb-conv-fill {
          height: 100%;
          border-radius: 999px;
          transform-origin: left center;
          transition: width 450ms cubic-bezier(0.33, 1, 0.68, 1);
          animation: lb-conv-grow 450ms cubic-bezier(0.33, 1, 0.68, 1);
        }
        .lb-conv-fill--points {
          background: ${POINTS_SERIES_COLOR};
        }
        .lb-conv-fill--plaa {
          background: ${PLAA_SERIES_COLOR};
        }
        .lb-conv-points {
          font: var(--text-label-md);
          color: var(--text-secondary);
          font-variant-numeric: tabular-nums;
        }
        @keyframes lb-conv-grow {
          from {
            transform: scaleX(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .lb-conv-fill {
            transition: none;
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
