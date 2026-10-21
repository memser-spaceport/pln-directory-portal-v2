export type { FeedbackStatus } from '@/services/plaa/feedback/feedback.types';
export { STATUS_LABELS } from '@/services/plaa/feedback/feedback.types';

import type { FeedbackStatus } from '@/services/plaa/feedback/feedback.types';

/** Every status an admin can move an item to, in board order (§2). */
export const FEEDBACK_STATUS_ORDER: FeedbackStatus[] = [
  'under_review',
  'todo',
  'in_progress',
  'completed',
  'declined',
  'duplicate',
];
