'use client';

import Image from 'next/image';
import { LeaderboardEntry } from '../types';

interface PastLeaderboardSectionProps {
  roundNumber: number;
  leaderboardData: LeaderboardEntry[];
}

/**
 * PastLeaderboardSection - Displays top 10 points leaderboard for a past round
 * @param roundNumber - The round number to display in the title
 * @param leaderboardData - Leaderboard data (up to 10 entries)
 */
export default function PastLeaderboardSection({ roundNumber, leaderboardData }: PastLeaderboardSectionProps) {
  // Display only the data provided (up to 10 items)
  const visibleData = leaderboardData.slice(0, 10);

  return (
    <>
      <section className="leaderboard-section">
        <div className="leaderboard-section__container">
          {/* Header */}
          <div className="leaderboard-section__header">
            <h2 className="leaderboard-section__title">Points Leaderboard</h2>
            <p className="leaderboard-section__description">
              This leaderboard highlights the top 10 contributors who strengthened the network through verified
              activities in Round {roundNumber}.
            </p>
          </div>

          {/* Leaderboard Table */}
          <div className="leaderboard-section__table-wrapper">
            {/* Table Header */}
            <div className="leaderboard-section__table-header">
              <h2 className="leaderboard-section__table-title">Round {roundNumber}: Top 10 Leaderboard</h2>
            </div>

            {/* Table Rows */}
            <div className="leaderboard-section__table-content">
              <div className="leaderboard-section__table leaderboard-section__table--last">
                {visibleData.map((entry, index) => (
                  <div
                    key={`${entry.name}-${entry.rank}`}
                    className={`leaderboard-section__row ${index === visibleData.length - 1 ? 'leaderboard-section__row--last' : ''}`}
                  >
                    <div className="leaderboard-section__row-left">
                      <div className="leaderboard-section__rank-cell">
                        <span className="leaderboard-section__rank">#{entry.rank}</span>
                        {entry.rank === 1 && (
                          <Image
                            src="/icons/rounds/points_leader_board/first.svg"
                            alt="1st place"
                            width={24}
                            height={28}
                          />
                        )}
                        {entry.rank === 2 && (
                          <Image
                            src="/icons/rounds/points_leader_board/second.svg"
                            alt="2nd place"
                            width={24}
                            height={28}
                          />
                        )}
                        {entry.rank === 3 && (
                          <Image
                            src="/icons/rounds/points_leader_board/third.svg"
                            alt="3rd place"
                            width={24}
                            height={28}
                          />
                        )}
                      </div>
                      <div className="leaderboard-section__user-info">
                        <span className="leaderboard-section__user-name">{entry.name}</span>
                        {entry.activities && (
                          <span className="leaderboard-section__user-activities">{entry.activities}</span>
                        )}
                      </div>
                    </div>
                    <div className="leaderboard-section__points">
                      <span className="leaderboard-section__points-value">{entry.points.toLocaleString()}</span>
                      <span className="leaderboard-section__points-label">points</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .leaderboard-section {
          width: 100%;
        }

        .leaderboard-section__container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 53px;
        }

        .leaderboard-section__header {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .leaderboard-section__title {
          font-size: 20px;
          font-weight: 600;
          line-height: normal;
          color: #16161f;
          margin: 0;
        }

        .leaderboard-section__description {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          color: #475569;
          margin: 0;
        }

        .leaderboard-section__table-wrapper {
          width: 100%;
          max-width: 100%;
        }

        .leaderboard-section__table-header {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px 24px;
          border: 1px solid #cbd5e1;
          border-top-left-radius: 24px;
          border-top-right-radius: 24px;
          background-color: white;
        }

        .leaderboard-section__table-title {
          font-size: 18px;
          font-weight: 600;
          line-height: 20px;
          color: #0f172a;
          margin: 0;
        }

        .leaderboard-section__table-content {
          display: flex;
          flex-direction: column;
        }

        .leaderboard-section__table {
          width: 100%;
          background-color: white;
          flex: 1;
          border-left: 1px solid #cbd5e1;
          border-right: 1px solid #cbd5e1;
        }

        .leaderboard-section__table--last {
          border-bottom: 1px solid #cbd5e1;
          border-bottom-left-radius: 24px;
          border-bottom-right-radius: 24px;
          overflow: hidden;
        }

        .leaderboard-section__row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px;
          border-bottom: 1px solid #cbd5e1;
          background-color: white;
        }

        .leaderboard-section__row--last {
          border-bottom: none;
        }

        .leaderboard-section__row-left {
          display: flex;
          align-items: flex-end;
          gap: 24px;
        }

        .leaderboard-section__rank-cell {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 58px;
          padding: 0 8px;
        }

        .leaderboard-section__rank {
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          color: #111827;
          white-space: nowrap;
        }

        .leaderboard-section__user-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 218px;
        }

        .leaderboard-section__user-name {
          font-size: 16px;
          font-weight: 600;
          line-height: 20px;
          color: #475569;
        }

        .leaderboard-section__user-activities {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          color: #4b5563;
        }

        .leaderboard-section__points {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: flex-end;
          text-align: right;
          width: 47px;
        }

        .leaderboard-section__points-value {
          font-size: 18px;
          font-weight: 700;
          line-height: 20px;
          color: #2563eb;
        }

        .leaderboard-section__points-label {
          font-size: 16px;
          font-weight: 400;
          line-height: 20px;
          color: #4b5563;
        }

        @media (max-width: 1024px) {
          .leaderboard-section__table-wrapper {
            width: 100%;
          }
        }

        @media (max-width: 768px) {
          .leaderboard-section__row {
            padding: 16px;
          }

          .leaderboard-section__row-left {
            gap: 16px;
          }

          .leaderboard-section__user-info {
            width: auto;
            flex: 1;
          }

          .leaderboard-section__rank-cell {
            width: auto;
          }
        }
      `}</style>
    </>
  );
}
