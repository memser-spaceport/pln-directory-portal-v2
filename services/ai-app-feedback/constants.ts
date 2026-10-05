export enum AiAppFeedbackQueryKeys {
  AI_APP_FEEDBACK_LIST = 'ai-app-feedback-list',
  AI_APP_FEEDBACK_PINS = 'ai-app-feedback-pins',
  AI_APP_FEEDBACK_COMMENTS = 'ai-app-feedback-comments',
}

export const AI_APP_FEEDBACK_STATUSES = ['NEW', 'VIEWED', 'IMPLEMENTED'] as const;

export type AiAppFeedbackStatus = (typeof AI_APP_FEEDBACK_STATUSES)[number];

export const AI_APP_FEEDBACK_STATUS_LABELS: Record<AiAppFeedbackStatus, string> = {
  NEW: 'New',
  VIEWED: 'Reviewed',
  IMPLEMENTED: 'Shipped',
};

/** What the reporter says it is, picked on the written form. Not the item's FEEDBACK / COMMENT kind. */
export const AI_APP_FEEDBACK_REPORT_KINDS = ['bug', 'request', 'question', 'chore'] as const;

export type AiAppFeedbackReportKind = (typeof AI_APP_FEEDBACK_REPORT_KINDS)[number];

export type AiAppFeedbackPriority = 'P0' | 'P1' | 'P2' | 'P3';

export const AI_APP_FEEDBACK_PRIORITY_LABELS: Record<AiAppFeedbackPriority, string> = {
  P0: 'P0 — Blocking — nobody can work around this',
  P1: 'P1 — Serious — there is a workaround and it hurts',
  P2: 'P2 — Normal — worth doing, not urgent',
  P3: 'P3 — Someday — a good idea with no clock on it',
};
