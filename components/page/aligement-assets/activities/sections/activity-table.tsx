'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Activity } from '../types';
import { ACTIVITY_FORM_URL } from '@/constants/plaa';
import { useAlignmentAssetsAnalytics } from '@/analytics/alignment-assets.analytics';

interface ActivityTableProps {
  activities: Activity[];
  onRowClick: (activity: Activity) => void;
}

/**
 * ActivityTable - Displays activities grouped by category in a table format
 * Rows are clickable to show activity details
 */
export default function ActivityTable({ activities, onRowClick }: ActivityTableProps) {
  const { onActivitiesFormLinkClicked } = useAlignmentAssetsAnalytics();

  // Group activities by category
  const groupedActivities = activities.reduce((acc, activity) => {
    if (!acc[activity.category]) {
      acc[activity.category] = [];
    }
    acc[activity.category].push(activity);
    return acc;
  }, {} as Record<string, Activity[]>);

  const categories = Object.keys(groupedActivities);

  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [visibleCount, setVisibleCount] = useState(5);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Get filtered activities based on selected category
  const filteredActivities = selectedCategory === 'All' 
    ? activities 
    : activities.filter(activity => activity.category === selectedCategory);

  const toggleCard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const showMore = () => {
    setVisibleCount(prev => prev + 8);
  };

  const handleFormLinkClick = (e: React.MouseEvent, activity: Activity) => {
    e.stopPropagation();
    onActivitiesFormLinkClicked({
      activityId: activity.id,
      activityName: activity.activity,
      category: activity.category,
      points: activity.points,
    }, ACTIVITY_FORM_URL);
  };

  const handleViewDetails = (e: React.MouseEvent, activity: Activity) => {
    e.stopPropagation();
    onRowClick(activity);
  };

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
                            onClick={(e) => handleFormLinkClick(e, activity)}
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
          {/* Category Filter - Mobile Only */}
          <div className="activity-filter">
            <h3 className="activity-filter__title">Filter by Category</h3>
            <div className="activity-filter__buttons">
              <button
                className={`activity-filter__btn ${selectedCategory === 'All' ? 'activity-filter__btn--active' : ''}`}
                onClick={() => setSelectedCategory('All')}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  className={`activity-filter__btn ${selectedCategory === category ? 'activity-filter__btn--active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="activity-list-wrapper">
            {/* Activity Cards */}
            {filteredActivities.slice(0, visibleCount).map((activity) => {
              const isExpanded = expandedCards[activity.id];
              return (
                <div 
                  key={activity.id} 
                  className={`activity-card ${isExpanded ? 'activity-card--expanded' : ''}`}
                  onClick={(e) => toggleCard(activity.id, e)}
                >
                  <div className="activity-card__top">
                    <div className="activity-card__category-pill">
                      {activity.category}
                    </div>
                    <button className="activity-card__toggle">
                      <Image
                        src={isExpanded ? '/icons/arrow-up.svg' : '/icons/arrow-down-light.svg'}
                        alt="Toggle"
                        width={16}
                        height={16}
                      />
                    </button>
                  </div>

                  <div className="activity-card__content">
                    <h3 className="activity-card__title">{activity.activity}</h3>
                    <div className="activity-card__points">{activity.points} points</div>
                    
                    {isExpanded && (
                      <div className="activity-card__details">
                        <div className="activity-card__network-value">
                          <span className="activity-card__label">Network Value:</span>
                          <p>
                            {activity.hasFormLink ? (
                              <>
                                {activity.networkValue.replace(' (form).', ' ')}
                                <Link 
                                  href={ACTIVITY_FORM_URL}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="activity-card__form-link"
                                  onClick={(e) => handleFormLinkClick(e, activity)}
                                >
                                  (form)
                                </Link>.
                              </>
                            ) : (
                              activity.networkValue
                            )}
                          </p>
                        </div>
                        <button 
                          className="activity-card__view-details"
                          onClick={(e) => handleViewDetails(e, activity)}
                        >
                          View Details
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {visibleCount < filteredActivities.length && (
              <button className="activity-cards__show-more" onClick={showMore}>
                Show +{Math.min(8, filteredActivities.length - visibleCount)} more
              </button>
            )}
            
            {/* If no items filter msg? Optional */}
          </div>
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
            gap: 0;
          }

          /* Filter Section */
          .activity-filter {
            padding: 24px 16px;
            background: #ffffff;
            border-bottom: 1px solid #e2e8f0;
          }

          .activity-filter__title {
            font-size: 16px;
            font-weight: 600;
            line-height: 24px;
            color: #0f172a;
            margin: 0 0 16px 0;
          }

          .activity-filter__buttons {
            display: flex;
            flex-wrap: nowrap;
            gap: 8px;
            overflow-x: auto;
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* IE and Edge */
          }

          .activity-filter__buttons::-webkit-scrollbar {
            display: none; /* Chrome, Safari, Opera */
          }

          .activity-filter__btn {
            padding: 8px 16px;
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 999px;
            font-size: 14px;
            font-weight: 500;
            color: #475569;
            cursor: pointer;
            transition: all 0.2s ease;
            white-space: nowrap;
          }

          .activity-filter__btn--active {
            background: #eff6ff;
            border-color: #3b82f6;
            color: #3b82f6;
          }

          .activity-filter__btn:hover:not(.activity-filter__btn--active) {
            border-color: #94a3b8;
            background: #f8fafc;
          }

          /* Activity Cards Container */
          .activity-list-wrapper {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            background: #ffffff;
          }

          .activity-card {
            background: #ffffff;
            border: none;
            border-bottom: 1px solid #e2e8f0;
            padding: 16px;
            transition: all 0.2s ease;
          }

          /* Last item (Show More button or last card) */
          .activity-cards__show-more {
             width: 100%;
             padding: 16px;
             background: #ffffff;
             border: none;
             color: #3b82f6;
             font-size: 14px;
             font-weight: 500;
             cursor: pointer;
             margin-top: 0;
             transition: all 0.2s ease;
             text-align: center;
             border-radius: 0;
          }

          .activity-card__top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
          }

          .activity-card__category-pill {
            background: #f1f5f9;
            padding: 4px 12px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 500;
            color: #475569;
          }

          .activity-card__toggle {
            background: none;
            border: none;
            padding: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
          }

          .activity-card__title {
            font-size: 16px;
            font-weight: 600;
            line-height: 24px;
            color: #0f172a;
            margin: 0 0 4px 0;
          }

          .activity-card__points {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 0;
          }

          .activity-card__details {
            margin-top: 4px;
            padding-top: 16px;
            animation: fadeIn 0.2s ease;
          }

          .activity-card__network-value {
            margin-bottom: 16px;
          }

          .activity-card__label {
            display: block;
            font-size: 14px;
            font-weight: 500;
            color: #0f172a;
            margin-bottom: 4px;
          }

          .activity-card__network-value p {
            font-size: 14px;
            line-height: 22px;
            color: #475569;
            margin: 0;
          }

          .activity-card__view-details {
            background: none;
            border: none;
            padding: 2px;
            color: #3b82f6;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
            display: block;
            text-align: right;
            width: 100%;
          }

          .activity-card__view-details:hover {
            text-decoration: underline;
          }

          .activity-card__form-link {
            color: #3b82f6;
            text-decoration: underline;
          }

          .activity-cards__show-more {
             width: 100%;
             padding: 16px;
             background: transparent;
             border: none;
             color: #3b82f6;
             font-size: 14px;
             font-weight: 500;
             cursor: pointer;
             margin-top: 0;
             transition: all 0.2s ease;
             text-align: center;
          }

          .activity-cards__show-more:hover {
             text-decoration: underline;
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-4px); }
            to { opacity: 1; transform: translateY(0); }
          }
        }
      `}</style>
    </>
  );
}

