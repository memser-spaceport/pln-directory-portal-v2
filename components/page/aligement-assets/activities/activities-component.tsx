'use client';

import { useState } from 'react';
import HeroSection from './sections/hero-section';
import ActivityTable from './sections/activity-table';
import ActivityDetailModal from './sections/activity-detail-modal';
import SupportSection from '../rounds/sections/support-section';
import { activitiesData } from './data';
import { Activity } from './types';
import { useAlignmentAssetsAnalytics } from '@/analytics/alignment-assets.analytics';

/**
 * ActivitiesComponent - Main component for displaying activities and points collection
 * Uses data from ./data/activities.data.ts
 */
export default function ActivitiesComponent() {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { onActivitiesRowClicked, onActivitiesModalClosed } = useAlignmentAssetsAnalytics();

  const handleRowClick = (activity: Activity) => {
    onActivitiesRowClicked({
      activityId: activity.id,
      activityName: activity.activity,
      category: activity.category,
      points: activity.points,
    });
    setSelectedActivity(activity);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (selectedActivity) {
      onActivitiesModalClosed({
        activityId: selectedActivity.id,
        activityName: selectedActivity.activity,
        category: selectedActivity.category,
        points: selectedActivity.points,
      });
    }
    setIsModalOpen(false);
    setSelectedActivity(null);
  };

  return (
    <>
      <div className="activities-component">
        {/* Hero Section with Title and Submit Button */}
        <HeroSection data={activitiesData.hero} />

        {/* Activities Table */}
        <ActivityTable 
          activities={activitiesData.activities}
          onRowClick={handleRowClick}
        />

        {/* Support Section */}
        <SupportSection />
      </div>

      {/* Activity Detail Modal */}
      <ActivityDetailModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        activity={selectedActivity}
      />

      <style jsx>{`
        .activities-component {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 48px;
          padding: 0;
        }

        @media (max-width: 768px) {
          .activities-component {
            gap: 32px;
          }
        }
      `}</style>
    </>
  );
}


