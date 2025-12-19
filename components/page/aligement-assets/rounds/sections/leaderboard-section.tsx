'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { LeaderboardEntry } from '../types';

interface LeaderboardSectionProps {
  view: 'current' | 'alltime';
  onViewChange: (view: 'current' | 'alltime') => void;
  currentSnapshotData: LeaderboardEntry[];
  cumulativeData: LeaderboardEntry[];
}

/**
 * LeaderboardSection - Displays points leaderboard with search and view toggle
 * @param view - Current view mode ('current' or 'alltime')
 * @param onViewChange - Callback when view is changed
 * @param currentSnapshotData - Current round leaderboard data
 * @param cumulativeData - All-time leaderboard data
 */
export default function LeaderboardSection({ 
  view, 
  onViewChange,
  currentSnapshotData,
  cumulativeData
}: LeaderboardSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(5);
  
  // Select data based on current view
  const allData = useMemo(() => {
    return view === 'current' ? currentSnapshotData : cumulativeData;
  }, [view, currentSnapshotData, cumulativeData]);
  
  // Filter data based on search term
  const filteredData = allData.filter(entry => 
    entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.activities.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Get visible data
  const visibleData = filteredData.slice(0, visibleCount);
  const hasMore = filteredData.length > visibleCount;
  const remainingCount = filteredData.length - visibleCount;

  const handleShowMore = () => {
    setVisibleCount(prev => prev + 10);
  };

  return (
    <>
      <section className="leaderboard-section">
        <div className="leaderboard-section__container">
          {/* Header */}
          <div className="leaderboard-section__header">
            <h2 className="leaderboard-section__title">Points Leaderboard</h2>
            <p className="leaderboard-section__description">
              This leaderboard highlights contributors who have strengthened the network through verified activities in the current snapshot. View Current Round or slide over to view the All-Time Leaderboard to see ongoing impact.
            </p>
          </div>

          {/* Info Banner */}
          <div className="leaderboard-section__info-banner">
            <p className="leaderboard-section__info-text">
              <strong>Note:</strong> Leaderboard updates weekly as new contributions are verified. Missing points? Submit for review during the Appeal Window.
            </p>
          </div>

          {/* Leaderboard Table */}
          <div className="leaderboard-section__table-wrapper">
            {/* Filter Header */}
            <div className="leaderboard-section__filter-header">
              <div className="leaderboard-section__search">
                <div className="leaderboard-section__search-input">
                  <svg className="leaderboard-section__search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14.5 14.5L10.5 10.5M12 7C12 9.76142 9.76142 12 7 12C4.23858 12 2 9.76142 2 7C2 4.23858 4.23858 2 7 2C9.76142 2 12 4.23858 12 7Z" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <input
                    type="text"
                    className="leaderboard-section__search-field"
                    placeholder="Search for a participant"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="leaderboard-section__view-toggle">
                <button 
                  className={`leaderboard-section__toggle-btn ${view === 'current' ? 'leaderboard-section__toggle-btn--active' : ''}`}
                  onClick={() => onViewChange('current')}
                >
                  Current Round
                </button>
                <button 
                  className={`leaderboard-section__toggle-btn ${view === 'alltime' ? 'leaderboard-section__toggle-btn--active' : ''}`}
                  onClick={() => onViewChange('alltime')}
                >
                  All-time
                </button>
              </div>
            </div>

            {/* Table Rows */}
            <div className="leaderboard-section__table">
              {visibleData.map((entry, index) => (
                <div 
                  key={`${entry.name}-${entry.rank}`} 
                  className={`leaderboard-section__row ${index === visibleData.length - 1 && !hasMore ? 'leaderboard-section__row--last' : ''}`}
                >
                  <div className="leaderboard-section__row-left">
                    <div className="leaderboard-section__rank-cell">
                      <span className="leaderboard-section__rank">#{entry.rank}</span>
                      {entry.rank === 1 && (
                        <Image src="/icons/rounds/points_leader_board/first.svg" alt="1st place" width={24} height={28} />
                      )}
                      {entry.rank === 2 && (
                        <Image src="/icons/rounds/points_leader_board/second.svg" alt="2nd place" width={24} height={28} />
                      )}
                      {entry.rank === 3 && (
                        <Image src="/icons/rounds/points_leader_board/third.svg" alt="3rd place" width={24} height={28} />
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

            {/* Show More */}
            {hasMore && (
              <div className="leaderboard-section__show-more">
                <button className="leaderboard-section__show-more-btn" onClick={handleShowMore}>
                  <span>Show +{Math.min(10, remainingCount)} more</span>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 6L8 10L12 6" stroke="#156FF7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            )}
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
          gap: 53px;
          align-items: center;
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

        .leaderboard-section__info-banner {
          background-color: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 100px;
          padding: 4px 8px;
          max-width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .leaderboard-section__info-text {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          color: #475569;
          text-align: center;
          margin: 0;
        }

        .leaderboard-section__info-text strong {
          font-weight: 600;
        }

        .leaderboard-section__table-wrapper {
          width: 829px;
          max-width: 100%;
          box-shadow: 0px 0px 1px 0px rgba(15, 23, 42, 0.12), 0px 4px 4px 0px rgba(15, 23, 42, 0.04);
        }

        .leaderboard-section__filter-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          border: 1px solid #cbd5e1;
          border-top-left-radius: 24px;
          border-top-right-radius: 24px;
          background-color: white;
        }

        .leaderboard-section__search {
          width: 320px;
        }

        .leaderboard-section__search-input {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background-color: white;
          box-shadow: 0px 1px 2px 0px rgba(15, 23, 42, 0.16);
        }

        .leaderboard-section__search-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        .leaderboard-section__search-field {
          flex: 1;
          border: none;
          outline: none;
          font-size: 14px;
          font-weight: 500;
          line-height: 24px;
          color: #0f172a;
          background: transparent;
        }

        .leaderboard-section__search-field::placeholder {
          color: #94a3b8;
        }

        .leaderboard-section__view-toggle {
          display: flex;
          align-items: center;
          background-color: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 4px;
          overflow: hidden;
        }

        .leaderboard-section__toggle-btn {
          padding: 10px 16px;
          border: 1px solid transparent;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          cursor: pointer;
          transition: background-color 0.15s ease, color 0.15s ease;
          background-color: transparent;
          color: #0f172a;
          min-width: 120px;
          box-sizing: border-box;
        }

        .leaderboard-section__toggle-btn--active {
          background-color: #156ff7;
          color: white;
          border-color: #cbd5e1;
        }

        .leaderboard-section__table {
          width: 100%;
          background-color: white;
          min-height: 365px;
        }

        .leaderboard-section__row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px;
          border-left: 1px solid #cbd5e1;
          border-right: 1px solid #cbd5e1;
          border-bottom: 1px solid #cbd5e1;
          background-color: white;
        }

        .leaderboard-section__row--last {
          border-bottom-left-radius: 24px;
          border-bottom-right-radius: 24px;
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

        .leaderboard-section__show-more {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          border-left: 1px solid #cbd5e1;
          border-right: 1px solid #cbd5e1;
          border-bottom: 1px solid #cbd5e1;
          border-bottom-left-radius: 24px;
          border-bottom-right-radius: 24px;
          background-color: white;
        }

        .leaderboard-section__show-more-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          color: #156ff7;
          cursor: pointer;
        }

        .leaderboard-section__show-more-btn:hover {
          text-decoration: underline;
        }

        @media (max-width: 1024px) {
          .leaderboard-section__table-wrapper {
            width: 100%;
          }
          
          .leaderboard-section__info-banner {
            width: 100%;
          }
        }

        @media (max-width: 768px) {
          .leaderboard-section__filter-header {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }
          
          .leaderboard-section__search {
            width: 100%;
          }
          
          .leaderboard-section__view-toggle {
            align-self: center;
          }
          
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