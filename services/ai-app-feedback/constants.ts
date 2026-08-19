export enum AiAppFeedbackQueryKeys {
  AI_APP_FEEDBACK_LIST = 'ai-app-feedback-list',
}

export const AI_APP_FEEDBACK_STATUSES = ['NEW', 'VIEWED', 'IMPLEMENTED'] as const;

export type AiAppFeedbackStatus = (typeof AI_APP_FEEDBACK_STATUSES)[number];

export const AI_APP_FEEDBACK_STATUS_LABELS: Record<AiAppFeedbackStatus, string> = {
  NEW: 'New',
  VIEWED: 'Viewed',
  IMPLEMENTED: 'Implemented',
};
