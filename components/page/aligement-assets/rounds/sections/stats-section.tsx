'use client';

import { useState } from 'react';
import { StatsSectionData } from '../types';

interface StatsSectionProps {
  data: StatsSectionData;
}

const MOBILE_VISIBLE_ACTIVITIES = 6;

/**
 * StatsSection - Displays statistics table with participants, regions, and activities
 * @param data - Stats section data from master JSON
 */
export default function StatsSection({ data }: StatsSectionProps) {
  const stats = data;
  const [isActivitiesExpanded, setIsActivitiesExpanded] = useState(false);
  const [isLabweekActivitiesExpanded, setIsLabweekActivitiesExpanded] = useState(false);

  const hiddenActivitiesCount = Math.max(0, stats.incentivizedActivities.length - MOBILE_VISIBLE_ACTIVITIES);
  const hiddenLabweekActivitiesCount = stats?.labweek25IncentivizedActivities 
    ? Math.max(0, stats.labweek25IncentivizedActivities.length - MOBILE_VISIBLE_ACTIVITIES) 
    : 0;

  return (
    <>
      <section className="stats-section">
        <div className="stats-section__container">
          {/* Statistics Table */}
          <table className="stats-section__table">
            <tbody>
              {/* Onboarded Participants */}
              <tr className="stats-section__row">
                <td className="stats-section__label"># of Onboarded Participants:</td>
                <td className="stats-section__value">{stats.onboardedParticipants}</td>
              </tr>

              {/* Regions Unlocked */}
              <tr className="stats-section__row stats-section__row--activities">
                <td className="stats-section__label">Regions Unlocked:</td>
                <td className="stats-section__value">
                  <div className="stats-section__chips">
                    {stats.regionsUnlocked.map((region, index) => (
                      <span key={`region-${region}`} className="stats-section__chip">
                        {region}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>

              {/* Incentivized Activities */}
              <tr className="stats-section__row stats-section__row--activities">
                <td className="stats-section__label">Incentivized Activities:</td>
                <td className="stats-section__value">
                  <div className="stats-section__chips">
                    {stats.incentivizedActivities.map((activity, index) => (
                      <span 
                        key={`activity-${activity}-${index}`} 
                        className={`stats-section__chip ${!isActivitiesExpanded && index >= MOBILE_VISIBLE_ACTIVITIES ? 'stats-section__chip--hidden-mobile' : ''}`}
                      >
                        {activity}
                      </span>
                    ))}
                  </div>
                  {hiddenActivitiesCount > 0 && (
                    <button 
                      className="stats-section__show-more"
                      onClick={() => setIsActivitiesExpanded(!isActivitiesExpanded)}
                      type="button"
                    >
                      {isActivitiesExpanded ? '- Show less' : `+ Show ${hiddenActivitiesCount} more`}
                    </button>
                  )}
                </td>
              </tr>

              {/* Labweek25 Incentivized Activities */}
              {stats?.labweek25IncentivizedActivities && stats.labweek25IncentivizedActivities.length > 0 && <tr className="stats-section__row stats-section__row--activities">
                <td className="stats-section__label">Labweek25 Incentivized Activities:</td>
                <td className="stats-section__value">
                  <div className="stats-section__chips">
                    {stats?.labweek25IncentivizedActivities?.map((activity, index) => (
                      <span 
                        key={`labweek-activity-${activity}-${index}`} 
                        className={`stats-section__chip ${!isLabweekActivitiesExpanded && index >= MOBILE_VISIBLE_ACTIVITIES ? 'stats-section__chip--hidden-mobile' : ''}`}
                      >
                        {activity}
                      </span>
                    ))}
                  </div>
                  {hiddenLabweekActivitiesCount > 0 && (
                    <button 
                      className="stats-section__show-more"
                      onClick={() => setIsLabweekActivitiesExpanded(!isLabweekActivitiesExpanded)}
                      type="button"
                    >
                      {isLabweekActivitiesExpanded ? '- Show less' : `+ Show ${hiddenLabweekActivitiesCount} more`}
                    </button>
                  )}
                </td>
              </tr>}

              {/* Total Points Collected */}
              <tr className="stats-section__row">
                <td className="stats-section__label">Total Points Collected:</td>
                <td className="stats-section__value">{stats.totalPointsCollected}</td>
              </tr>

              {/* Total Tokens Available */}
              {stats.totalTokensAvailable && <tr className="stats-section__row">
                <td className="stats-section__label">Total Tokens Available:</td>
                <td className="stats-section__value">{stats.totalTokensAvailable}</td>
              </tr>}

              {/* Total Tokens Distributed  */}
              {stats.totalTokensDistributed && <tr className="stats-section__row">
                <td className="stats-section__label">Total Tokens Distributed:</td>
                <td className="stats-section__value">{stats.totalTokensDistributed}</td>
              </tr>}

              {/* Number of Buybacks */}
              {typeof stats?.numberOfBuybacks === 'number' && stats.numberOfBuybacks > 0 && (
                <tr className="stats-section__row">
                  <td className="stats-section__label"># of Buybacks:</td>
                  <td className="stats-section__value">{stats.numberOfBuybacks}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <style jsx>{`
        .stats-section {
          width: 100%;
          max-width: 100%;
          overflow: hidden;
        }

        .stats-section__container {
          width: 100%;
          max-width: 100%;
        }

        .stats-section__table {
          width: 100%;
          max-width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          background-color: white;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          overflow: hidden;
          table-layout: fixed;
        }

        .stats-section__row {
          min-height: 53px;
        }

        .stats-section__row:not(:first-child) .stats-section__label,
        .stats-section__row:not(:first-child) .stats-section__value {
          border-top: 1px solid #e5e7eb;
        }

        .stats-section__row--activities {
          min-height: auto;
        }

        .stats-section__label {
          width: 243px;
          min-width: 243px;
          padding: 16.5px 24px;
          font-size: 14px;
          font-weight: 600;
          line-height: 20px;
          color: #475569;
          vertical-align: middle;
        }

        .stats-section__value {
          padding: 16.5px 12px;
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          color: #475569;
          vertical-align: middle;
        }

        .stats-section__chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .stats-section__chip {
          display: inline-flex;
          align-items: center;
          padding: 6px;
          background-color: #f1f5f9;
          border-radius: 100px;
          font-size: 14px;
          font-weight: 500;
          line-height: 14px;
          color: #475569;
          white-space: nowrap;
        }

        .stats-section__show-more {
          display: none;
          margin-top: 8px;
          padding: 0;
          background: none;
          border: none;
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          color: #156ff7;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .stats-section__show-more:hover {
          color: #1152b8;
        }

        .stats-section__show-more:focus {
          outline: none;
        }

        .stats-section__show-more:focus-visible {
          outline: 2px solid #156ff7;
          outline-offset: 2px;
          border-radius: 4px;
        }

        @media (max-width: 1024px) {
          .stats-section__label {
            width: 200px;
            min-width: 200px;
          }
        }

        @media (max-width: 768px) {
          .stats-section__table {
            table-layout: auto;
          }

          /* Simple value rows stay horizontal on mobile */
          .stats-section__row {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            max-width: 100%;
          }

          .stats-section__label {
            width: auto;
            min-width: auto;
            flex: 1;
            padding: 16px;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }

          .stats-section__value {
            padding: 16px;
            text-align: right;
            flex-shrink: 0;
          }

          /* Chip rows (activities) stack vertically */
          .stats-section__row--activities {
            flex-direction: column;
            align-items: flex-start;
          }

          .stats-section__row--activities .stats-section__label {
            width: 100%;
            border-bottom: none;
          }

          .stats-section__row--activities .stats-section__value {
            width: 100%;
            max-width: 100%;
            padding: 0 16px 16px 16px;
            text-align: left;
            box-sizing: border-box;
          }

          .stats-section__row--activities .stats-section__chips {
            max-width: 100%;
          }

          /* Remove separator between label and value within stacked rows */
          .stats-section__row--activities:not(:first-child) .stats-section__value {
            border-top: none;
          }

          .stats-section__chip--hidden-mobile {
            display: none;
          }

          .stats-section__chip {
            white-space: normal;
            word-wrap: break-word;
          }

          .stats-section__show-more {
            display: inline-block;
          }
        }
      `}</style>
    </>
  );
}
