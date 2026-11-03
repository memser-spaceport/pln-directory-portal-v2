import { demoteTopHeadings } from './demoteTopHeadings';
import { sanitizeHtml } from './sanitizeHtml';

export { JOB_DESCRIPTION_SANITIZE_CONFIG } from './sanitizeProfiles';

/**
 * Run it on `normalizeJobDescriptionHtml(raw)`, in that order — see JOB_DESCRIPTION_SANITIZE_CONFIG.
 *
 * A posting's own `h1` and `h2` become `h3` (LAB-3089): the role page has its `h1` (the role title) and its `h2`
 * ("About the role"). The drawer styles every heading level alike, so nothing changes on screen.
 */
export function sanitizeJobDescriptionHtml(html: string): string {
  return demoteTopHeadings(sanitizeHtml(html, 'jobDescription'));
}
