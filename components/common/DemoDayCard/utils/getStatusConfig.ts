import { DemoDayStatus } from '../types';

import s from '../DemoDayCard.module.scss';

export const getStatusConfig = (status: DemoDayStatus) => {
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
