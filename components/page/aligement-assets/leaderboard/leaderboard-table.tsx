'use client';

import { TrophyIcon } from './leaderboard-icons';
import { getInitials } from './leaderboard.mapper';
import type { LeaderboardRow } from './leaderboard.types';

/** Medal fills for the top three ranks, from the design. */
const MEDALS = ['#E8A53D', '#9CA8B8', '#C8884B'];

/** Avatar palette, cycled by row index (design: lbColors). */
const AVATAR_COLORS = [
  '#F2792B',
  '#8B5CF6',
  '#13A89E',
  '#048746',
  '#365A83',
  '#D6418B',
  '#159A8A',
  '#334155',
  '#2C4A6D',
  '#E8A53D',
];

interface LeaderboardTableProps {
  readonly caption: string;
  readonly rows: LeaderboardRow[];
  readonly error: string | null;
}

export default function LeaderboardTable({ caption, rows, error }: LeaderboardTableProps) {
  // The category column only exists when the API actually resolved categories
  // for these entries — an all-empty column is worse than no column.
  const showCategory = rows.some((row) => row.topCategory);

  return (
    <div className="lb-card">
      <div className="lb-caption">
        <TrophyIcon size={18} color="#E8A53D" />
        <span>{caption}</span>
      </div>

      {error || rows.length === 0 ? (
        <div className="lb-empty">
          {error
            ? 'The leaderboard is only available when you are signed in. Sign in to see how contributors rank this snapshot.'
            : 'No contributors have collected points in this snapshot yet.'}
        </div>
      ) : (
        <>
          <div className="lb-head">
            <span className="lb-rank-col">#</span>
            <span className="lb-name-col">Contributor</span>
            {showCategory && <span className="lb-cat-col">Top category</span>}
            <span className="lb-pts-col">Points</span>
          </div>
          {rows.map((row, index) => {
            const isTop3 = row.rank <= 3;
            return (
              <div key={`${row.rank}-${row.name}`} className={`lb-row${isTop3 ? ' lb-row--top' : ''}`}>
                <span
                  className={`lb-rank${isTop3 ? ' lb-rank--medal' : ''}`}
                  style={isTop3 ? { background: MEDALS[row.rank - 1] } : undefined}
                >
                  {row.rank}
                </span>
                <span className="lb-avatar" style={{ background: AVATAR_COLORS[index % AVATAR_COLORS.length] }}>
                  {getInitials(row.name)}
                </span>
                <div className="lb-name-col lb-name">{row.name}</div>
                {showCategory && <span className="lb-cat-col lb-cat">{row.topCategory ?? ''}</span>}
                <span className="lb-pts-col lb-pts">{row.points.toLocaleString('en-US')}</span>
              </div>
            );
          })}
        </>
      )}

      <style jsx>{`
        .lb-card {
          background: var(--surface-card);
          border-radius: var(--radius-2xl);
          box-shadow: var(--ring-hairline), var(--shadow-xs);
          overflow: hidden;
        }
        .lb-caption {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-subtle);
          font: var(--text-body-md);
          color: var(--text-secondary);
        }
        .lb-empty {
          padding: 32px 20px;
          text-align: center;
          font: var(--text-body-md);
          color: var(--text-tertiary);
        }
        .lb-head {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 9px clamp(12px, 2vw, 20px);
          background: var(--surface-page);
          font: var(--text-label-sm);
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-tertiary);
        }
        /* Columns share one flex track set between the header row and the data
           rows, so they stay aligned while flexing with the container instead
           of sitting at fixed pixel widths. */
        .lb-rank-col {
          flex: 0 0 34px;
          text-align: center;
        }
        .lb-name-col {
          flex: 3 1 180px;
          min-width: 0;
        }
        .lb-cat-col {
          flex: 1 1 110px;
          min-width: 0;
        }
        .lb-pts-col {
          flex: 0 1 120px;
          min-width: 72px;
          text-align: right;
        }
        .lb-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px clamp(12px, 2vw, 20px);
          border-bottom: 1px solid var(--border-faint);
        }
        .lb-row--top {
          background: linear-gradient(90deg, rgba(232, 165, 61, 0.06), transparent 60%);
        }
        .lb-rank {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          flex: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font: var(--text-label-lg);
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          background: var(--surface-page);
          color: var(--text-tertiary);
          box-shadow: var(--ring-hairline);
        }
        .lb-rank--medal {
          color: #fff;
          box-shadow: var(--shadow-xs);
        }
        .lb-avatar {
          width: 38px;
          height: 38px;
          border-radius: 999px;
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font: var(--text-label-md);
          font-weight: 600;
          flex: none;
        }
        /* Long names and categories truncate rather than forcing the row to
           overflow its card. */
        .lb-name {
          font: var(--text-label-lg);
          font-weight: 600;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .lb-cat {
          font: var(--text-body-md);
          color: var(--text-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .lb-pts {
          font: var(--text-heading-sm);
          color: var(--text-primary);
          font-variant-numeric: tabular-nums;
        }
        @media (max-width: 640px) {
          .lb-cat-col {
            display: none;
          }
          .lb-pts-col {
            flex: 0 0 84px;
            min-width: 0;
          }
        }
      `}</style>
    </div>
  );
}
