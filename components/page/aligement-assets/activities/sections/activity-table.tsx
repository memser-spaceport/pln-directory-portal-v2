'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Activity } from '../types';
import { ACTIVITY_FORM_URL } from '@/constants/plaa';
import { useAlignmentAssetsAnalytics } from '@/analytics/alignment-assets.analytics';

interface ActivityTableProps {
  activities: Activity[];
  onRowClick: (activity: Activity) => void;
}

const SECTION_METADATA = [
  {
    id: 'Repeatable',
    title: 'Repeatable',
    badge: 'Monthly/Ongoing',
    description: 'Complete these regularly to maximize points.'
  },
  {
    id: 'Recurring',
    title: 'Recurring',
    badge: 'Periodic/Event-Based',
    description: 'Tied to specific events or time-bound opportunities.'
  },
  {
    id: 'One-Time',
    title: 'One-Time',
    badge: 'Foundational',
    description: 'Typically completed once — set yourself up for success.'
  }
];

export default function ActivityTable({ activities, onRowClick }: ActivityTableProps) {
  const { onActivitiesFormLinkClicked, onActivitiesRowClicked } = useAlignmentAssetsAnalytics();

  // Group activities by frequency
  const groupedActivities = activities.reduce((acc, activity) => {
    const freq = activity.frequency || 'Repeatable'; // fallback to Repeatable if missing
    if (!acc[freq]) {
      acc[freq] = [];
    }
    acc[freq].push(activity);
    return acc;
  }, {} as Record<string, Activity[]>);

  // Manage expanded state for sections (all open by default)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Repeatable': true,
    'Recurring': true,
    'One-Time': true,
  });

  const [mobileActiveTab, setMobileActiveTab] = useState<string>(SECTION_METADATA[0].id);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleExternalClick = (e: React.MouseEvent, activity: Activity) => {
    e.stopPropagation();
    
    // Priority: ctaLink > submissionLink > ACTIVITY_FORM_URL
    const url = activity.popupContent.ctaLink
      || (!activity.hasFormLink && activity.popupContent.submissionLink ? activity.popupContent.submissionLink.url : null)
      || ACTIVITY_FORM_URL;

    onActivitiesFormLinkClicked({
      activityId: activity.id,
      activityName: activity.activity,
      category: activity.category,
      points: activity.points,
    }, url);
    
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCardClick = (activity: Activity) => {
    onActivitiesRowClicked({
      activityId: activity.id,
      activityName: activity.activity,
      category: activity.category,
      points: activity.points,
    });
    onRowClick(activity);
  };


  return (
    <section className="activities-grouped-cards">
      <div className="mobile-tabs-container">
        {SECTION_METADATA.map((section) => {
          const isActive = mobileActiveTab === section.id;
          return (
            <button
              key={`tab-${section.id}`}
              className={`mobile-tab ${isActive ? 'active' : ''}`}
              onClick={() => setMobileActiveTab(section.id)}
            >
              {section.title}
            </button>
          );
        })}
      </div>

      {SECTION_METADATA.map((section) => {
        const sectionActivities = groupedActivities[section.id] || [];
        if (sectionActivities.length === 0) return null;

        const isExpanded = expandedSections[section.id];
        const isMobileActive = mobileActiveTab === section.id;

        return (
          <div key={section.id} className={`activity-section ${isMobileActive ? 'mobile-active' : 'mobile-hidden'}`}>
            <div 
              className="activity-section__header" 
              onClick={() => toggleSection(section.id)}
            >
              <div className="activity-section__header-content">
                <div className="activity-section__title-row">
                  <h2 className="activity-section__title">{section.title}</h2>
                  <div className="activity-section__badge">
                    <span>{section.badge}</span>
                    <span className="activity-section__badge-divider">|</span>
                    <span>{sectionActivities.length} activities</span>
                  </div>
                </div>
                <p className="activity-section__description">{section.description}</p>
              </div>
              <button className="activity-section__toggle">
                <Image
                  src={isExpanded ? '/icons/arrow-up.svg' : '/icons/arrow-down-light.svg'}
                  alt="Toggle"
                  width={24}
                  height={24}
                />
              </button>
            </div>

            {isExpanded && (
              <div className="activity-section__grid">
                {sectionActivities.map((activity) => (
                  <div 
                    key={activity.id} 
                    className="activity-card"
                    onClick={() => handleCardClick(activity)}
                  >
                    <div className="activity-card__top">
                      <span className="activity-card__category">{activity.category}</span>
                      <div className="activity-card__points">
                        <Image src="/icons/points-icon.svg" alt="points-icon" width={16} height={16} />
                        <span className="activity-card__points-val">{activity.points} points</span>
                      </div>
                    </div>

                    <div className="activity-card__body">
                      <h3 className="activity-card__title">{activity.activity}</h3>
                      <p className="activity-card__desc">
                        {activity.networkValue}
                      </p>
                    </div>

                    <div className="activity-card__footer">
                      <div className="activity-card__tracking">
                        {(() => {
                          const vType = activity.verificationType || (activity.isAutoTracked ? 'Auto' : 'Submission');
                          if (vType === 'Auto') return (
                            <>
                              <Image src="/icons/auto-tracked.svg" alt="Auto-tracked" width={16} height={16} />
                              <span>Auto-tracked</span>
                            </>
                          );
                          if (vType === 'Hybrid') return (
                            <>
                              <Image src="/icons/hybrid-icon.svg" alt="Hybrid" width={16} height={16} />
                              <span>Hybrid</span>
                            </>
                          );
                          return (
                            <>
                              <Image src="/icons/submission.svg" alt="Submission" width={16} height={16} />
                              <span>Submission</span>
                            </>
                          );
                        })()}
                      </div>
                      <button 
                        className="activity-card__submit-btn"
                        onClick={(e) => handleExternalClick(e, activity)}
                      >
                        {activity.popupContent.submitButtonText || 'Submit Activity >'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <style jsx>{`
        .activities-grouped-cards {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .activity-section {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }

        .activity-section__header {
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .activity-section__header:hover {
          background-color: #f8fafc;
        }

        .activity-section__header-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .activity-section__title-row {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .activity-section__title {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .activity-section__badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f1f5f9;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 500;
          color: #475569;
        }

        .activity-section__badge-divider {
          color: #cbd5e1;
        }

        .activity-section__description {
          font-size: 15px;
          color: #475569;
          margin: 0;
        }

        .activity-section__toggle {
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
        }

        .activity-section__grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          padding: 0 24px 24px 24px;
        }

        .activity-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          cursor: pointer;
          transition: box-shadow 0.2s ease, transform 0.2s ease;
          height: 100%;
        }

        .activity-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          transform: translateY(-2px);
          border-color: #cbd5e1;
        }

        .activity-card__top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
          gap: 12px;
        }

        .activity-card__category {
          color: #2563eb;
          font-size: 12px;
          font-weight: 600;
          background: #eff6ff;
          padding: 6px 12px;
          border-radius: 999px;
          white-space: normal;
        }

        .activity-card__points {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
          border: 1px solid #e2e8f0;
          padding: 4px 10px;
          border-radius: 999px;
          flex-shrink: 0;
        }

        .activity-card__points-val {
          color: #0f172a;
        }

        .activity-card__body {
          flex: 1;
        }

        .activity-card__title {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 8px 0;
          line-height: 1.4;
        }

        .activity-card__desc {
          font-size: 14px;
          color: #475569;
          line-height: 1.5;
          margin: 0 0 24px 0;
        }

        .activity-card__form-link {
          color: #2563eb;
          text-decoration: underline;
        }

        .activity-card__footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
          padding-top: 16px;
          border-top: 1px solid #f1f5f9;
        }

        .activity-card__tracking {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }

        .activity-card__submit-btn {
          background: #2563eb;
          color: #ffffff;
          border: none;
          padding: 8px 16px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .activity-card__submit-btn:hover {
          background: #1d4ed8;
        }

        .mobile-tabs-container {
          display: none;
        }

        @media (max-width: 1024px) {
          .activity-section__grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .mobile-tabs-container {
            display: flex;
            gap: 32px;
            margin-bottom: 24px;
            overflow-x: auto;
            border-bottom: 1px solid #e2e8f0;
            padding: 0 16px;
            -ms-overflow-style: none; /* IE and Edge */
            scrollbar-width: none; /* Firefox */
          }
          
          .mobile-tabs-container::-webkit-scrollbar {
            display: none; /* Chrome, Safari and Opera */
          }

          .mobile-tab {
            padding: 12px 0;
            background: none;
            color: #64748b;
            font-size: 15px;
            font-weight: 500;
            border: none;
            border-bottom: 2px solid transparent;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.2s ease;
            margin-bottom: -1px;
          }

          .mobile-tab.active {
            color: #2563eb;
            border-bottom: 2px solid #2563eb;
            font-weight: 600;
          }

          .activity-section.mobile-hidden {
            display: none;
          }

          .activity-section {
            border: none;
            border-radius: 0;
            background: transparent;
          }

          .activity-section__header {
            padding: 0 0 16px 0;
            cursor: default;
            background-color: transparent !important;
          }

          .activity-section__title,
          .activity-section__toggle {
            display: none;
          }
          
          .activity-section__title-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .activity-section__grid {
            grid-template-columns: 1fr;
            padding: 0;
          }
        }
      `}</style>
    </section>
  );
}
