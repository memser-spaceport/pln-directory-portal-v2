'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAlignmentAssetsAnalytics } from '@/analytics/alignment-assets.analytics';
import LeaderboardTable from './leaderboard-table';
import SnapshotPanel from './snapshot-panel';
import { ArrowsClockwiseIcon, LightningIcon, RankingIcon } from './leaderboard-icons';
import type { LeaderboardCategoryWeight, LeaderboardSnapshot, LeaderboardViewData } from './leaderboard.types';

type LeaderboardTab = 'current' | 'alltime';

interface LeaderboardComponentProps {
  readonly leaderboard: LeaderboardViewData;
  /** Newest round first. */
  readonly snapshots: LeaderboardSnapshot[];
  readonly categoryWeights: LeaderboardCategoryWeight[];
  /** `?round=N` deep link, and the target of the `/rounds/N` redirect (PLAA-95). */
  readonly initialRound?: number;
}

export default function LeaderboardComponent({
  leaderboard,
  snapshots,
  categoryWeights,
  initialRound,
}: LeaderboardComponentProps) {
  const router = useRouter();
  const [tab, setTab] = useState<LeaderboardTab>('current');
  // An unknown or absent round falls back to the live snapshot rather than 404ing
  // a link that was valid when it was sent.
  const requestedIndex = snapshots.findIndex((snapshot) => snapshot.roundNumber === initialRound);
  const [snapshotIndex, setSnapshotIndex] = useState(requestedIndex >= 0 ? requestedIndex : 0);
  const { onLeaderboardViewToggleClicked } = useAlignmentAssetsAnalytics();

  const liveSnapshot = snapshots.find((snapshot) => snapshot.isCurrentRound) ?? snapshots[0];
  const rows = tab === 'current' ? leaderboard.currentSnapshot : leaderboard.cumulative;

  const caption =
    tab === 'alltime'
      ? 'Cumulative points across every snapshot since the program began. Recognition compounds — consistent contributors rise over time.'
      : liveSnapshot
        ? `Points collected this snapshot (${liveSnapshot.label} · ${liveSnapshot.period}). Resets when the snapshot closes.`
        : 'Points collected this snapshot. Resets when the snapshot closes.';

  const handleTabChange = (next: LeaderboardTab) => {
    onLeaderboardViewToggleClicked(next);
    setTab(next);
  };

  return (
    <div className="lb-page">
      <div className="lb-header">
        <div>
          <h1 className="lb-h1">
            Leaderboard <RankingIcon size={24} color="var(--color-brand-text)" />
          </h1>
          <p className="lb-sub">
            Top contributors recognized for the work that strengthens
            <br />
            the Protocol Labs Network.
          </p>
        </div>
        <div className="lb-tabs">
          {(
            [
              { key: 'current', label: 'Current snapshot' },
              { key: 'alltime', label: 'All-time' },
            ] as const
          ).map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => handleTabChange(option.key)}
              className={`lb-tab${tab === option.key ? ' lb-tab--active' : ''}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <LeaderboardTable caption={caption} rows={rows} error={leaderboard.error} />

      <div className="lb-cta">
        <ArrowsClockwiseIcon size={40} color="#fff" />
        <div className="lb-cta-body">
          <h3 className="lb-cta-title">The network grows because people contribute.</h3>
          <p className="lb-cta-copy">
            Every introduction, tool and shared lesson compounds — more contribution means a stronger network, and a
            stronger network rewards every contributor. Find your next way to climb the leaderboard.
          </p>
        </div>
        <button type="button" className="lb-cta-btn" onClick={() => router.push('/alignment-asset/activities')}>
          <LightningIcon size={17} color="var(--color-brand-text)" />
          Explore how to contribute
        </button>
      </div>

      {snapshots.length > 0 && (
        <SnapshotPanel
          snapshots={snapshots}
          index={snapshotIndex}
          onIndexChange={setSnapshotIndex}
          categoryWeights={categoryWeights}
        />
      )}

      <style jsx>{`
        .lb-page {
          /* Design-system tokens the prototype assumes; this app does not ship
             them globally, so they are scoped to this page. */
          --surface-card: #ffffff;
          --surface-page: rgb(249, 250, 251);
          --text-primary: rgb(10, 12, 17);
          --text-secondary: rgb(69, 84, 104);
          --text-tertiary: rgb(136, 151, 174);
          --border-subtle: rgba(27, 56, 96, 0.12);
          --border-faint: rgba(27, 56, 96, 0.06);
          /* Headings, icons and accents. */
          --color-brand: #0b4f66;
          --color-brand-text: #094157;
          /* Charts keep their own blue — see plaa-home-tokens.tsx. */
          --color-chart: #365a83;
          --pl-blue-25: #f5f8fb;
          --pl-green-600: rgb(4, 135, 70);
          --pl-slate-300: rgb(175, 186, 202);
          --radius-md: 8px;
          --radius-lg: 10px;
          --radius-xl: 12px;
          --radius-2xl: 16px;
          --ring-hairline: inset 0 0 0 1px var(--border-subtle);
          --shadow-xs: 0 1px 2px rgba(15, 23, 42, 0.06);
          --shadow-md: 0 2px 4px -2px rgba(15, 23, 42, 0.06), 0 4px 8px -2px rgba(15, 23, 42, 0.1);
          --duration-base: 180ms;
          --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          --text-display-md: 500 32px/40px var(--font-sans);
          --text-display-sm: 600 24px/32px var(--font-sans);
          --text-heading-md: 600 18px/26px var(--font-sans);
          --text-heading-sm: 600 16px/24px var(--font-sans);
          --text-body-lg: 400 16px/24px var(--font-sans);
          --text-body-md: 400 14px/20px var(--font-sans);
          --text-label-lg: 500 14px/20px var(--font-sans);
          --text-label-md: 500 12px/16px var(--font-sans);
          --text-label-sm: 500 11px/16px var(--font-sans);

          /* Fills the content column instead of sitting in a fixed 900px box;
             the reading measure is held by .lb-sub / .lb-cta-copy instead, so
             the cards and table still use the full width. */
          width: 100%;
          font-family: var(--font-sans);
          color: var(--text-primary);
          display: flex;
          flex-direction: column;
        }
        .lb-header {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px 24px;
          margin-bottom: 18px;
        }
        .lb-header > div:first-child {
          flex: 1 1 320px;
          min-width: 0;
        }
        .lb-h1 {
          font: var(--text-display-md);
          letter-spacing: -0.02em;
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0;
          color: var(--text-primary);
        }
        .lb-sub {
          font: var(--text-body-lg);
          color: var(--text-secondary);
          margin: 6px 0 0;
          max-width: 620px;
        }
        .lb-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          padding: 4px;
          background: var(--surface-card);
          border-radius: var(--radius-lg);
          box-shadow: var(--ring-hairline);
          flex: 0 1 auto;
        }
        .lb-tab {
          flex: 1 1 auto;
          white-space: nowrap;
          height: 34px;
          padding: 0 14px;
          border: none;
          border-radius: var(--radius-md);
          background: transparent;
          color: var(--text-secondary);
          font: var(--text-label-lg);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--duration-base);
        }
        .lb-tab--active {
          background: var(--color-brand);
          color: #fff;
        }
        .lb-cta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 20px 24px;
          margin: 24px 0;
          padding: 26px 28px;
          border-radius: var(--radius-2xl);
          background: var(--color-brand);
          color: #fff;
          box-shadow: var(--shadow-md);
        }
        .lb-cta-body {
          flex: 1 1 320px;
          min-width: 0;
        }
        .lb-cta-title {
          font: var(--text-heading-md);
          color: #fff;
          margin: 0;
        }
        .lb-cta-copy {
          font: var(--text-body-md);
          color: rgba(255, 255, 255, 0.86);
          margin: 5px 0 0;
          max-width: 560px;
        }
        .lb-cta-btn {
          flex: 0 1 auto;
          white-space: nowrap;
          height: 48px;
          padding: 0 24px;
          border: none;
          background: #fff;
          color: var(--color-brand-text);
          font: var(--text-heading-sm);
          border-radius: var(--radius-lg);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 9px;
        }
        .lb-cta-btn:hover {
          background: var(--pl-blue-25);
        }
        /* The wrapping above handles the narrow cases on its own; these only
           realign what has already wrapped. */
        @media (max-width: 860px) {
          .lb-header,
          .lb-cta {
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
