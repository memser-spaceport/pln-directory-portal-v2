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
import { useRouter, useSearchParams } from 'next/navigation';

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

  // `?category=` deep link, used by the Leaderboard's underutilized-category
  // cards (PLAA-95). An unknown category matches nothing, so fall back to the
  // full list rather than showing an empty page.
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams?.get('category') ?? null;
  const matching = categoryParam
    ? activitiesData.activities.filter((a) => a.category.toLowerCase() === categoryParam.toLowerCase())
    : [];
  const activeCategory = matching.length > 0 ? categoryParam : null;
  const visibleActivities = activeCategory ? matching : activitiesData.activities;

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

        {activeCategory && (
          <div className="activities-filter">
            <span className="activities-filter__label">
              Showing <b>{activeCategory}</b> activities
            </span>
            <button
              type="button"
              className="activities-filter__clear"
              onClick={() => router.push('/alignment-asset/activities')}
            >
              Show all activities
            </button>
          </div>
        )}

        {/* Activities Table */}
        <ActivityTable
          activities={visibleActivities}
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

        .activities-filter {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          padding: 10px 14px;
          border-radius: 8px;
          background: #f1f5f9;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          color: #475569;
        }

        .activities-filter__clear {
          border: none;
          background: none;
          padding: 0;
          cursor: pointer;
          color: #0b4f66;
          font-weight: 600;
          font-size: 13px;
          font-family: 'Inter', sans-serif;
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
