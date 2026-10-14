/**
 * Export all data for Activities component
 */
import type { Activity } from '../types';

export { activitiesData } from './activities.data';

/** Activities tagged `audience: 'pl-infra-members'` are shown only to PL Infra team members. */
export const isInfraOnlyActivity = (activity: Activity) => activity.audience === 'pl-infra-members';

export const canSeeActivity = (activity: Activity, isInfraMember: boolean) =>
  !isInfraOnlyActivity(activity) || isInfraMember;

export const isOpenActivity = (activity: Activity, isInfraMember = false) =>
  !activity.isSunset && canSeeActivity(activity, isInfraMember);
