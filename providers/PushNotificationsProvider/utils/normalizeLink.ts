/**
 * Normalizes a notification link for comparison with the current pathname.
 * - Handles absolute URLs (https://example.com/path → /path)
 * - Strips query parameters and hash fragments
 * - Ensures a leading `/`
 */
export function normalizeLink(link: string): string {
  try {
    if (/^https?:\/\//i.test(link)) {
      return new URL(link).pathname;
    }
  } catch {
    // fall through to path-only handling
  }
  const pathOnly = link.split('?')[0].split('#')[0];
  return pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
}
