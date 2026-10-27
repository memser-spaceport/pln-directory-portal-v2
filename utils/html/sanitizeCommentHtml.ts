import { sanitizeHtml } from './sanitizeHtml';

export { COMMENT_SANITIZE_CONFIG } from './sanitizeProfiles';

export function sanitizeCommentHtml(html: string): string {
  return sanitizeHtml(html, 'comment');
}
