import type { AiAppFeedbackStatus } from '@/services/ai-app-feedback/constants';

import { ALL_FEEDBACK_STATUSES } from './constants';

export type FeedbackStatusFilterValue = AiAppFeedbackStatus | typeof ALL_FEEDBACK_STATUSES;

export interface FeedbackTab {
  name: string;
  count: number;
}
