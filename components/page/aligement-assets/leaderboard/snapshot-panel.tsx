'use client';

import { useRouter } from 'next/navigation';
import CategoryRadar from './category-radar';
import {
  ArrowRightIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CoinsIcon,
  StarIcon,
  TrendIcon,
  UsersThreeIcon,
} from './leaderboard-icons';
import { UNDERUTILIZED_RATIO } from './leaderboard.mapper';
import type { LeaderboardCategoryWeight, LeaderboardSnapshot } from './leaderboard.types';
import { activitiesData } from '../activities/data';

/**
 * The design's boost card names a suggested activity and its points. There is
 * no "suggested activity" endpoint, so the suggestion is read from the same
 * activities catalogue the Activities page renders — the highest-value activity
 * in that category. Catalogue-sourced, not invented, and it moves when the
 * catalogue does.
 */
const suggestionFor = (category: string): { title: string; points: string } | null => {
  const normalise = (value: string) => value.toLowerCase().replace(/[^a-z]/g, '');
  const best = activitiesData.activities
    .filter((activity) => normalise(activity.category) === normalise(category))
    .sort((a, b) => parseInt(b.points, 10) - parseInt(a.points, 10))[0];
  return best ? { title: best.activity, points: best.points } : null;
};

const activitiesHref = (category: string) =>
  `/alignment-asset/activities?category=${encodeURIComponent(category)}`;

/** At most this many boost cards, so the column stays readable. */
const MAX_UNDER_CARDS = 4;

interface SnapshotPanelProps {
  /** Newest round first. */
  readonly snapshots: LeaderboardSnapshot[];
  readonly index: number;
  readonly onIndexChange: (index: number) => void;
  readonly categoryWeights: LeaderboardCategoryWeight[];
}

const percentDelta = (current: number, previous: number): string | null => {
  if (!previous) return null;
  const delta = Math.round(((current - previous) / previous) * 1000) / 10;
  return `${delta >= 0 ? '+' : ''}${delta}%`;
};

export default function SnapshotPanel({ snapshots, index, onIndexChange, categoryWeights }: SnapshotPanelProps) {
  const router = useRouter();
  const snapshot = snapshots[index];
  const previous = snapshots[index + 1] ?? null;

  if (!snapshot) return null;

  const canOlder = index < snapshots.length - 1;
  const canNewer = index > 0;

  // "Activities completed" from the design has no live equivalent — the API
  // publishes a catalogue of available activities, not a completion count — so
  // that tile is not rendered.
  const metrics = [
    {
      key: 'points',
      icon: <CoinsIcon size={16} color="var(--color-brand-text)" />,
      label: 'Points awarded',
      value: snapshot.points,
      previous: previous?.points ?? null,
    },
    {
      key: 'participants',
      icon: <UsersThreeIcon size={16} color="var(--color-brand-text)" />,
      label: 'Participants',
      value: snapshot.participants,
      previous: previous?.participants ?? null,
    },
  ];

  const max = Math.max(...snapshot.categories.map((category) => category.value), 0);
  const weightFor = (name: string) =>
    categoryWeights.find((weight) => weight.category.toLowerCase().replace(/[^a-z]/g, '') === name.toLowerCase().replace(/[^a-z]/g, ''));

  const under = snapshot.categories
    .filter((category) => max > 0 && category.value < max * UNDERUTILIZED_RATIO)
    .sort((a, b) => a.value - b.value)
    .slice(0, MAX_UNDER_CARDS);

  return (
    <div className="snap-card">
      <div className="snap-header">
        <div>
          <div className="snap-title-row">
            <h3 className="snap-title">{snapshot.label} snapshot</h3>
            {snapshot.isCurrentRound && (
              <span className="snap-live">
                <span className="snap-live-dot" />
                Live
              </span>
            )}
          </div>
          <p className="snap-period">{snapshot.period}</p>
        </div>
        <div className="snap-nav">
          <button
            type="button"
            onClick={() => canOlder && onIndexChange(index + 1)}
            aria-label="Older snapshot"
            disabled={!canOlder}
            className="snap-arrow"
          >
            <CaretLeftIcon size={18} />
          </button>
          <span className="snap-position">
            {snapshots.length - index} / {snapshots.length}
          </span>
          <button
            type="button"
            onClick={() => canNewer && onIndexChange(index - 1)}
            aria-label="Newer snapshot"
            disabled={!canNewer}
            className="snap-arrow"
          >
            <CaretRightIcon size={18} />
          </button>
        </div>
      </div>

      <div className="snap-metrics">
        {metrics.map((metric) => {
          const delta = metric.previous == null ? null : percentDelta(metric.value, metric.previous);
          const up = metric.previous == null || metric.value >= metric.previous;
          return (
            <div key={metric.key} className="snap-metric">
              <div className="snap-metric-label">
                {metric.icon}
                <span>{metric.label}</span>
              </div>
              <div className="snap-metric-value-row">
                <span className="snap-metric-value">{metric.value.toLocaleString('en-US')}</span>
                {delta && (
                  <span className={`snap-delta${up ? '' : ' snap-delta--down'}`}>
                    <TrendIcon size={12} up={up} />
                    {delta}
                  </span>
                )}
              </div>
              {delta && <div className="snap-metric-vs">vs {previous?.label}</div>}
            </div>
          );
        })}
      </div>

      <div className="snap-divider" />

      <h4 className="snap-subtitle">Most popular activity categories</h4>
      <p className="snap-copy">
        Each category gets a fixed share of the snapshot&apos;s PLAA reward pool, so when fewer people contribute to a
        category, every contribution there collects a larger slice. Learn more about our{' '}
        <a href="/alignment-asset/incentive-model">incentive model.</a>
      </p>
      <p className="snap-copy snap-copy--muted">
        <span className="snap-green">Starred categories</span> are underutilized, so points make a bigger impact.
      </p>

      <div className="snap-grid">
        <CategoryRadar categories={snapshot.categories} />
        <div>
          <div className="snap-under-title">Underutilized — boost these</div>
          <div className="snap-under-list">
            {under.length === 0 && <p className="snap-copy snap-copy--muted">Every category is tracking evenly this snapshot.</p>}
            {under.map((category) => {
              const weight = weightFor(category.name);
              const suggestion = suggestionFor(category.name);
              const href = activitiesHref(category.name);
              return (
                <div
                  key={category.name}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(href)}
                  onKeyDown={(event) => event.key === 'Enter' && router.push(href)}
                  className="snap-under"
                >
                  <span className="snap-under-icon">
                    <StarIcon size={18} color="#fff" />
                  </span>
                  <div className="snap-under-body">
                    <div className="snap-under-name-row">
                      <StarIcon size={12} color="var(--color-brand)" />
                      <span className="snap-under-name">{category.name}</span>
                    </div>
                    <div className="snap-under-hint">
                      {suggestion ? (
                        <>
                          {suggestion.title}
                          {' · '}
                          <b>{suggestion.points} pts</b>
                        </>
                      ) : (
                        <>
                          {weight?.percentOfTotal != null
                            ? `${weight.percentOfTotal}% of the snapshot pool`
                            : 'Open for contributions'}
                          {' · '}
                          <b>{category.value.toLocaleString('en-US')} pts collected</b>
                        </>
                      )}
                    </div>
                  </div>
                  <ArrowRightIcon size={16} color="var(--color-brand)" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        .snap-card {
          background: var(--surface-card);
          border-radius: var(--radius-2xl);
          box-shadow: var(--ring-hairline), var(--shadow-xs);
          padding: 24px;
        }
        .snap-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 22px;
        }
        .snap-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .snap-title {
          font: var(--text-heading-md);
          color: var(--text-primary);
          margin: 0;
        }
        .snap-live {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font: var(--text-label-sm);
          font-weight: 600;
          color: var(--pl-green-600);
          background: rgba(10, 153, 82, 0.1);
          padding: 3px 9px;
          border-radius: 999px;
        }
        .snap-live-dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: var(--pl-green-600);
        }
        .snap-period {
          font: var(--text-body-md);
          color: var(--text-tertiary);
          margin: 3px 0 0;
        }
        .snap-nav {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: none;
        }
        .snap-arrow {
          width: 38px;
          height: 38px;
          border: none;
          border-radius: var(--radius-md);
          flex: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--surface-card);
          color: var(--text-primary);
          box-shadow: var(--ring-hairline);
          cursor: pointer;
          transition: all var(--duration-base);
        }
        .snap-arrow:disabled {
          background: transparent;
          color: var(--pl-slate-300);
          box-shadow: none;
          cursor: not-allowed;
        }
        .snap-position {
          font: var(--text-label-lg);
          font-weight: 600;
          color: var(--text-secondary);
          font-variant-numeric: tabular-nums;
          min-width: 54px;
          text-align: center;
        }
        .snap-metrics {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          margin-bottom: 24px;
        }
        .snap-metric {
          /* Tiles share the row evenly and drop to a single column only when
             they can no longer hold their basis. */
          flex: 1 1 220px;
          min-width: 0;
          background: var(--surface-page);
          border-radius: var(--radius-xl);
          box-shadow: var(--ring-hairline);
          padding: 16px 18px;
        }
        .snap-metric-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-tertiary);
          font: var(--text-label-md);
          font-weight: 600;
        }
        .snap-metric-value-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-top: 9px;
        }
        .snap-metric-value {
          font: var(--text-display-sm);
          color: var(--text-primary);
          letter-spacing: -0.01em;
          font-variant-numeric: tabular-nums;
        }
        .snap-delta {
          font: var(--text-label-md);
          font-weight: 600;
          color: var(--pl-green-600);
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }
        .snap-delta--down {
          color: #e92215;
        }
        .snap-metric-vs {
          font: var(--text-label-sm);
          color: var(--text-tertiary);
          margin-top: 3px;
        }
        .snap-divider {
          height: 1px;
          background: var(--border-faint);
          margin-bottom: 20px;
        }
        .snap-subtitle {
          font: var(--text-heading-sm);
          color: var(--text-primary);
          margin: 0;
        }
        .snap-copy {
          font: var(--text-body-md);
          color: var(--text-secondary);
          margin: 6px 0 4px;
          line-height: 1.55;
        }
        .snap-copy--muted {
          color: var(--text-tertiary);
          margin: 0 0 8px;
        }
        .snap-copy a {
          color: var(--color-brand-text);
        }
        /* The underutilised highlight now uses the PLAA primary rather than
           green, so the copy no longer names a colour. */
        .snap-green {
          color: var(--color-brand-text);
          font-weight: 700;
        }
        .snap-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 24px;
          align-items: center;
        }
        /* Radar and the boost cards: both flex, both allowed to shrink, so the
           chart scales with the panel rather than pinning its track width.
           :global — the radar is rendered by CategoryRadar, so it carries that
           component's styled-jsx scope, not this one's, and a plain child
           selector never matches it. */
        .snap-grid > :global(:first-child) {
          flex: 1 1 280px;
          min-width: 0;
          /* A radar wider than this stops reading as a chart and starts reading
             as wallpaper. */
          max-width: 420px;
        }
        .snap-grid > :global(:last-child) {
          flex: 1 1 260px;
          min-width: 0;
        }
        .snap-under-title {
          font: var(--text-label-sm);
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-tertiary);
          margin-bottom: 10px;
        }
        .snap-under-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .snap-under {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 13px 15px;
          border-radius: var(--radius-xl);
          background: linear-gradient(135deg, rgba(11, 79, 102, 0.12), rgba(18, 112, 143, 0.05));
          box-shadow: inset 0 0 0 1.5px rgba(11, 79, 102, 0.32);
          cursor: pointer;
          transition: transform var(--duration-base), box-shadow var(--duration-base);
        }
        .snap-under:hover {
          transform: translateY(-2px);
          box-shadow: inset 0 0 0 1.5px rgba(11, 79, 102, 0.5), var(--shadow-md);
        }
        .snap-under-icon {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-lg);
          background: linear-gradient(135deg, #12708f, #0b4f66);
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: none;
        }
        .snap-under-body {
          flex: 1;
          min-width: 0;
        }
        .snap-under-name-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .snap-under-name {
          font: var(--text-label-lg);
          font-weight: 600;
          color: var(--text-primary);
        }
        .snap-under-hint {
          font: var(--text-label-md);
          color: var(--text-secondary);
        }
        .snap-under-hint b {
          color: var(--color-brand-text);
        }
        /* Wrapping is handled by the flex bases above; nothing to override. */
      `}</style>
    </div>
  );
}
