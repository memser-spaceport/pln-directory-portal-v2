'use client';

import HeroSection from './sections/hero-section';
import ActivityTable from './sections/activity-table';
import ActivityDetailModal from './sections/activity-detail-modal';
import SupportSection from '../rounds/sections/support-section';
import { activitiesData } from './data';
import { Activity } from './types';
import { useAlignmentAssetsAnalytics } from '@/analytics/alignment-assets.analytics';
import { useScrollDepthTracking } from '@/hooks/useScrollDepthTracking';
import useHash from '@/hooks/useHash';

/**
 * ActivitiesComponent - Main component for displaying activities and points collection
 * Uses data from ./data/activities.data.ts
 *
 * The open activity modal is derived directly from the URL hash (`#<activity-id>`),
 * so opening a deeplink renders the page with that activity's modal already open.
 * Row clicks and the close button update the hash (and notify listeners) instead of
 * holding separate modal state, keeping the URL as the single source of truth.
 */
export default function ActivitiesComponent() {
  const { onActivitiesRowClicked, onActivitiesModalClosed } = useAlignmentAssetsAnalytics();
  useScrollDepthTracking('activities');

  // Derive the open activity from the URL hash rather than syncing it into state.
  const hash = useHash();
  const activityId = hash ? (hash.startsWith('#') ? hash.slice(1) : hash) : null;
  const selectedActivity =
    activityId && activityId !== 'login'
      ? activitiesData.activities.find((a) => a.id === activityId) ?? null
      : null;
  const isModalOpen = selectedActivity !== null;

  // Update the hash and notify useHash (pushState alone doesn't emit 'hashchange').
  const updateHash = (newHash: string) => {
    window.history.pushState(null, '', newHash || window.location.pathname + window.location.search);
    window.dispatchEvent(new Event('hashchange'));
  };

  const handleRowClick = (activity: Activity) => {
    onActivitiesRowClicked({
      activityId: activity.id,
      activityName: activity.activity,
      category: activity.category,
      points: activity.points,
    });
    updateHash(`#${activity.id}`);
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
    updateHash('');
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
            gap: 12px;
          }
        }
      `}</style>
    </>
  );
}
