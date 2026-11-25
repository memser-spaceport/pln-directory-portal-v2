import { ACTIVITY_FORM_URL } from '@/constants/plaa';
import { Activity } from './types';

export function activitySubmitUrl(activity: Activity): string {
  const { ctaLink, submissionLink } = activity.popupContent;
  return ctaLink || (!activity.hasFormLink && submissionLink ? submissionLink.url : null) || ACTIVITY_FORM_URL;
}
