import type { FeedbackStatus } from '@/services/plaa/feedback/feedback.types';

export const FEEDBACK_STATUS_ORDER: FeedbackStatus[] = [
  'under_review',
  'todo',
  'in_progress',
  'completed',
  'declined',
  'duplicate',
];
