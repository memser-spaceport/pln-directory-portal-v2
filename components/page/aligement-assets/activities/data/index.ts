/**
 * Export all data for Activities component
 */
import type { Activity } from '../types';

export { activitiesData } from './activities.data';

export const isOpenActivity = (activity: Activity) => !activity.isSunset && !activity.audience;
