'use client';

import { StatsSectionData } from '../types';

interface StatsSectionProps {
  data: StatsSectionData;
}

/**
 * StatsSection - Displays statistics table with participants, regions, and activities
 * @param data - Stats section data from master JSON
 */
export default function StatsSection({ data }: StatsSectionProps) {
  const stats = data;

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
              <tr className="stats-section__row">
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
                      <span key={`activity-${activity}-${index}`} className="stats-section__chip">
                        {activity}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>

              {/* Incentivized Activities */}
              {stats?.labweek25IncentivizedActivities && stats.labweek25IncentivizedActivities.length > 0 && <tr className="stats-section__row stats-section__row--activities">
                <td className="stats-section__label">Labweek25 Incentivized Activities:</td>
                <td className="stats-section__value">
                  <div className="stats-section__chips">
                    {stats?.labweek25IncentivizedActivities?.map((activity, index) => (
                      <span key={`labweek-activity-${activity}-${index}`} className="stats-section__chip">
                        {activity}
                      </span>
                    ))}
                  </div>
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
              {stats.numberOfBuybacks && <tr className="stats-section__row">
                <td className="stats-section__label"># of Buybacks:</td>
                <td className="stats-section__value">{stats.numberOfBuybacks}</td>
              </tr>}
            </tbody>
          </table>
        </div>
      </section>

      <style jsx>{`
        .stats-section {
          width: 100%;
        }

        .stats-section__container {
          width: 100%;
        }

        .stats-section__table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          background-color: white;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          overflow: hidden;
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
          padding: 6px 12px;
          background-color: #f1f5f9;
          border-radius: 100px;
          font-size: 14px;
          font-weight: 500;
          line-height: 14px;
          color: #475569;
          white-space: nowrap;
        }

        @media (max-width: 1024px) {
          .stats-section__label {
            width: 200px;
            min-width: 200px;
          }
        }

        @media (max-width: 768px) {
          .stats-section__row {
            display: flex;
            flex-direction: column;
          }

          .stats-section__label {
            width: 100%;
            min-width: 100%;
            display: block;
          }

          .stats-section__value {
            display: block;
            padding: 16px 12px;
          }
        }
      `}</style>
    </>
  );
}
