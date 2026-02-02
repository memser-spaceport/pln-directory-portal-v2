import { DemoDayState } from '@/app/actions/demo-day.actions';
import s from './FoundersDashboardView.module.scss';

// Filter options for the table
export const INTERACTION_OPTIONS = [
  { label: 'All interactions', value: 'all' },
  { label: 'Liked', value: 'liked' },
  { label: 'Connected', value: 'connected' },
  { label: 'Investment Interest', value: 'invest' },
  { label: 'Intro Requested', value: 'intro' },
  { label: 'Feedback Requested', value: 'feedback' },
];

export const SORT_OPTIONS = [
  { label: 'Most recent', value: 'recent' },
  { label: 'Oldest first', value: 'oldest' },
  { label: 'Highest engagement', value: 'engagement_high' },
  { label: 'Lowest engagement', value: 'engagement_low' },
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
