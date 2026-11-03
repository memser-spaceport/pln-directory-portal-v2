import { sanitizeHtml } from './sanitizeHtml';

export { JOB_DESCRIPTION_SANITIZE_CONFIG } from './sanitizeProfiles';

/**
 * The opening and closing tags of an `h1` or `h2` in sanitized markup, whose tags DOMPurify writes in lowercase.
 * Escaped text (`&lt;h1`) never matches.
 */
const TOP_HEADING_TAG = /<(\/?)h[12](?=[\s>])/g;

/**
 * Run it on `normalizeJobDescriptionHtml(raw)`, in that order — see JOB_DESCRIPTION_SANITIZE_CONFIG.
 *
 * A posting's own `h1` and `h2` become `h3` (LAB-3089). The role page already has its `h1` (the role title) and its
 * `h2` ("About the role"); a posting's "The Role" or "Requirements" written as `h1` gave the page four of them. The
 * drawer styles every heading level alike, so nothing changes on screen.
 */
export function sanitizeJobDescriptionHtml(html: string): string {
  return sanitizeHtml(html, 'jobDescription').replace(TOP_HEADING_TAG, '<$1h3');
}
