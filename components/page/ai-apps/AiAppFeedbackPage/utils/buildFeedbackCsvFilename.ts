import { AI_APP_FEEDBACK_STATUS_LABELS } from '@/services/ai-app-feedback/constants';

import type { FeedbackStatusFilterValue } from '../types';

import { ALL_FEEDBACK_STATUSES } from '../constants';

function slugify(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '-');
}

/** Names the export after the filters that produced it, so two downloads never collide in the same folder. */
export function buildFeedbackCsvFilename(appTab: string, status: FeedbackStatusFilterValue): string {
  const parts = ['ai-app-feedback', slugify(appTab)];
  if (status !== ALL_FEEDBACK_STATUSES) {
    parts.push(slugify(AI_APP_FEEDBACK_STATUS_LABELS[status]));
  }

  return `${parts.join('-')}.csv`;
}
