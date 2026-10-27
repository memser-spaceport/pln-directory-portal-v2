import { sanitizeHtml } from './sanitizeHtml';

export { JOB_DESCRIPTION_SANITIZE_CONFIG } from './sanitizeProfiles';

/** Run it on `normalizeJobDescriptionHtml(raw)`, in that order — see JOB_DESCRIPTION_SANITIZE_CONFIG. */
export function sanitizeJobDescriptionHtml(html: string): string {
  return sanitizeHtml(html, 'jobDescription');
}
