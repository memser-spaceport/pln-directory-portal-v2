'use client';

import Link from 'next/link';
import { Activity } from '../types';
import { ACTIVITY_FORM_URL } from '@/constants/plaa';

interface ActivityTableProps {
  activities: Activity[];
  onRowClick: (activity: Activity) => void;
}

/**
 * ActivityTable - Displays activities grouped by category in a table format
 * Rows are clickable to show activity details
 */
export default function ActivityTable({ activities, onRowClick }: ActivityTableProps) {
  // Group activities by category
  const groupedActivities = activities.reduce((acc, activity) => {
    if (!acc[activity.category]) {
      acc[activity.category] = [];
    }
    acc[activity.category].push(activity);
    return acc;
  }, {} as Record<string, Activity[]>);

  const categories = Object.keys(groupedActivities);

  return (
    <>
      <section className="activity-table-section">
        {/* Desktop Table */}
        <div className="activity-table-wrapper">
          <table className="activity-table">
            <thead>
              <tr className="activity-table__header-row">
                <th className="activity-table__header activity-table__header--category">Category</th>
                <th className="activity-table__header activity-table__header--activity">Activity</th>
                <th className="activity-table__header activity-table__header--value">Network Value</th>
                <th className="activity-table__header activity-table__header--points">Points</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => {
                const categoryActivities = groupedActivities[category];
                return categoryActivities.map((activity, activityIndex) => (
                  <tr 
                    key={activity.id}
                    className="activity-table__row"
                    onClick={() => onRowClick(activity)}
                  >
                    {activityIndex === 0 && (
                      <td 
                        className="activity-table__cell activity-table__cell--category"
                        rowSpan={categoryActivities.length}
                      >
                        {category}
                      </td>
                    )}
                    <td className="activity-table__cell activity-table__cell--activity">
                      {activity.activity}
                    </td>
                    <td className="activity-table__cell activity-table__cell--value">
                      {activity.hasFormLink ? (
                        <>
                          {activity.networkValue.replace(' (form).', ' ')}
                          <Link 
                            href={ACTIVITY_FORM_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="activity-table__form-link"
                            onClick={(e) => e.stopPropagation()}
                          >
                            (form)
                          </Link>.
                        </>
                      ) : (
                        activity.networkValue
                      )}
                    </td>
                    <td className="activity-table__cell activity-table__cell--points">
                      {activity.points}
                    </td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="activity-cards">
          {categories.map((category) => (
            <div key={category} className="activity-cards__category">
              <h3 className="activity-cards__category-title">{category}</h3>
              <div className="activity-cards__list">
                {groupedActivities[category].map((activity) => (
                  <div 
                    key={activity.id}
                    className="activity-card"
                    onClick={() => onRowClick(activity)}
                  >
                    <div className="activity-card__header">
                      <span className="activity-card__activity">{activity.activity}</span>
                      <span className="activity-card__points">{activity.points}</span>
                    </div>
                    <p className="activity-card__value">
                      {activity.hasFormLink ? (
                        <>
                          {activity.networkValue.replace(' (form).', ' ')}
                          <Link 
                            href={ACTIVITY_FORM_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="activity-card__form-link"
                            onClick={(e) => e.stopPropagation()}
                          >
                            (form)
                          </Link>.
                        </>
                      ) : (
                        activity.networkValue
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <style jsx>{`
        .activity-table-section {
          width: 100%;
        }

        .activity-table-wrapper {
          width: 100%;
          overflow-x: auto;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
        }

        .activity-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 700px;
        }

        .activity-table__header-row {
          background-color: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .activity-table__header {
          padding: 16px 12px;
          text-align: left;
          font-size: 16px;
          font-weight: 700;
          line-height: 20px;
          color: #4B5563;

          white-space: nowrap;
        }

        .activity-table__header--category {
          width: 120px;
          border-top-left-radius: 16px;
        }

        .activity-table__header--activity {
          width: 280px;
        }

        .activity-table__header--value {
          width: auto;
        }

        .activity-table__header--points {
          width: 80px;
          text-align: right;
          border-top-right-radius: 16px;
        }

        .activity-table__row {
          border-bottom: 1px solid #f1f5f9;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .activity-table__row:last-child {
          border-bottom: none;
        }

        .activity-table__row:hover {
          background-color: #f8fafc;
        }

        .activity-table__cell {
          padding: 16px 12px;
          font-size: 14px;
          line-height: 20px;
          color: #475569;
          vertical-align: top;
        }

        .activity-table__cell--category {
          font-weight: 500;
          color: #0f172a;
          background-color: #fff;
          vertical-align: middle;
        }

        .activity-table__row:hover .activity-table__cell--category {
          background-color: #fff;
        }

        .activity-table__cell--activity {
          font-weight: 500;
          color: #0f172a;
        }

        .activity-table__cell--value {
          color: #475569;
        }

        .activity-table__cell--points {
          font-weight: 500;
          color: #0f172a;
          text-align: right;
          white-space: nowrap;
        }

        .activity-table__form-link {
          color: #156ff7;
          text-decoration: underline;
          text-underline-position: from-font;
        }

        .activity-table__form-link:hover {
          text-decoration: none;
        }

        /* Mobile Cards - Hidden by default */
        .activity-cards {
          display: none;
        }

        @media (max-width: 768px) {
          .activity-table-wrapper {
            display: none;
          }

          .activity-cards {
            display: flex;
            flex-direction: column;
            gap: 24px;
          }

          .activity-cards__category {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .activity-cards__category-title {
            font-size: 16px;
            font-weight: 600;
            line-height: 20px;
            color: #0f172a;
            margin: 0;
            padding-bottom: 8px;
            border-bottom: 1px solid #e2e8f0;
          }

          .activity-cards__list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .activity-card {
            padding: 16px;
            background: #fafafa;
            border-radius: 8px;
            cursor: pointer;
            transition: background-color 0.15s ease;
          }

          .activity-card:hover {
            background: #f1f5f9;
          }

          .activity-card__header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 8px;
          }

          .activity-card__activity {
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
            color: #0f172a;
          }

          .activity-card__points {
            font-size: 14px;
            font-weight: 600;
            line-height: 20px;
            color: #156ff7;
            white-space: nowrap;
          }

          .activity-card__value {
            font-size: 13px;
            font-weight: 400;
            line-height: 18px;
            color: #64748b;
            margin: 0;
          }

          .activity-card__form-link {
            color: #156ff7;
            text-decoration: underline;
          }
        }
      `}</style>
    </>
  );
}

