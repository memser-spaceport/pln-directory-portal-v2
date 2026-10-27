import { sanitizeHtml } from './sanitizeHtml';

export { SPV_SANITIZE_CONFIG } from './sanitizeProfiles';

// Quill stores spaces as &nbsp;, which stops a line from wrapping and pushes
// the hero wider than a phone.
const NBSP = /&nbsp;|&#0*160;|&#x0*a0;| /gi;

export function sanitizeSpvHtml(html: string | null | undefined): string {
  if (!html) return '';
  return sanitizeHtml(html.replace(NBSP, ' '), 'spv');
}
