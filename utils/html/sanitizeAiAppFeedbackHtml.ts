import { sanitizeHtml } from './sanitizeHtml';

export { AI_APP_FEEDBACK_SANITIZE_CONFIG } from './sanitizeProfiles';

export function sanitizeAiAppFeedbackHtml(html: string): string {
  return sanitizeHtml(html, 'aiAppFeedback');
}
