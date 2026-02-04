import { DemoDayState } from '@/app/actions/demo-day.actions';
import s from './FoundersDashboardView.module.scss';
import { createColumnHelper } from '@tanstack/react-table';
import { Investor } from '@/components/page/demo-day/FoundersDashboardView/types';

// Filter options for the table
export const INTERACTION_OPTIONS = [
  { label: 'All interactions', value: 'all' },
  { label: 'Showed investment interest', value: 'interested' },
  { label: 'Connected', value: 'connected' },
  { label: 'Liked', value: 'liked' },
  { label: 'Intro mage', value: 'introMade' },
  { label: 'Feedback given', value: 'feedbackGiven' },
  { label: 'Viewed slide', value: 'viewedSlide' },
  { label: 'Pitch video watched', value: 'pitchVideoWatched' },
  { label: 'Profile viewed', value: 'profileViewed' },
  { label: 'Founder profile clicked', value: 'founderProfileClicked' },
  { label: 'Team page clicked', value: 'teamPageClicked' },
  { label: 'Team website clicked', value: 'teamWebsiteClicked' },
];

export const SORT_OPTIONS = [
  { label: 'Most recent', value: 'recent' },
  { label: 'Oldest first', value: 'oldest' },
  { label: 'Most engaged', value: 'engagement_high' },
  { label: 'Name A-Z', value: 'desc' },
  { label: 'Name Z-A', value: 'asc' },
];

export const getStatusConfig = (status: DemoDayState['status'] | undefined) => {
  switch (status) {
    case 'UPCOMING':
      return {
        label: 'Upcoming',
        className: s.badgeUpcoming,
      };
    case 'ACTIVE':
      return {
        label: 'Active',
        className: s.badgeActive,
      };
    case 'COMPLETED':
      return {
        label: 'Completed',
        className: s.badgeCompleted,
      };
    case 'ARCHIVED':
      return {
        label: 'Archived',
        className: s.badgeArchived,
      };
    case 'REGISTRATION_OPEN':
      return {
        label: 'Registration Open',
        className: s.badgeRegistrationOpen,
      };
    default:
      return {
        label: status,
        className: s.badgeDefault,
      };
  }
};

// Create column helper for type-safe column definitions
export const columnHelper = createColumnHelper<Investor>();
