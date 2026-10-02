import DOMPurify from 'isomorphic-dompurify';

/**
 * Allowlist for SPV Spotlight's HTML fields: the admin-written hero description
 * (Quill) and the team's directory About. Sanitized on read like the other
 * rich-text bodies: the app ships no CSP, so this is the page's only defence.
 * Formatting and links only; no images, no `class`.
 */
export const SPV_SANITIZE_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'a', 'strong', 'em', 'b', 'i', 'u', 's', 'ul', 'ol', 'li', 'span'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOWED_URI_REGEXP: /^(?:https?:|mailto:)/i,
};

// Quill stores spaces as &nbsp;, which stops a line from wrapping and pushes
// the hero wider than a phone.
const NBSP = /&nbsp;|&#0*160;|&#x0*a0;| /gi;

export function sanitizeSpvHtml(html: string | null | undefined): string {
  if (!html) return '';
  return DOMPurify.sanitize(html.replace(NBSP, ' '), SPV_SANITIZE_CONFIG);
}
