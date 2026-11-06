import { sanitizeHtml } from './sanitizeHtml';

export { FORUM_POST_SANITIZE_CONFIG } from './sanitizeProfiles';

export function sanitizeForumPostHtml(html: string): string {
  return sanitizeHtml(html, 'forumPost');
}
