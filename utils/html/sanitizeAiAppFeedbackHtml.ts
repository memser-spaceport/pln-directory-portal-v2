import DOMPurify from 'isomorphic-dompurify';
import { FORUM_POST_SANITIZE_CONFIG } from './sanitizeForumPostHtml';

export const AI_APP_FEEDBACK_SANITIZE_CONFIG = {
  ...FORUM_POST_SANITIZE_CONFIG,
  ALLOWED_ATTR: [...FORUM_POST_SANITIZE_CONFIG.ALLOWED_ATTR, 'data-annotations'],
  ALLOW_DATA_ATTR: true,
};

export function sanitizeAiAppFeedbackHtml(html: string): string {
  return DOMPurify.sanitize(html ?? '', AI_APP_FEEDBACK_SANITIZE_CONFIG);
}
