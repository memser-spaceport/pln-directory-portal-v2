import type {
  AiAppFeedbackPriority,
  AiAppFeedbackReportKind,
  AiAppFeedbackStatus,
} from '@/services/ai-app-feedback/constants';

import { ALL_FEEDBACK_PRIORITIES, ALL_FEEDBACK_REPORT_KINDS, ALL_FEEDBACK_STATUSES } from './constants';

export type FeedbackStatusFilterValue = AiAppFeedbackStatus | typeof ALL_FEEDBACK_STATUSES;

export type FeedbackReportKindFilterValue = AiAppFeedbackReportKind | typeof ALL_FEEDBACK_REPORT_KINDS;

export type FeedbackPriorityFilterValue = AiAppFeedbackPriority | typeof ALL_FEEDBACK_PRIORITIES;

export interface FeedbackTab {
  name: string;
  count: number;
}
