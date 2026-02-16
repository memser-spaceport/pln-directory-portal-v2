/**
 * Normalizes a notification link for comparison with the current pathname.
 * - Strips query parameters and hash fragments
 * - Ensures a leading `/`
 */
export function normalizeLink(link: string): string {
  // Strip query params and hash
  const pathOnly = link.split('?')[0].split('#')[0];
  // Ensure leading slash
  return pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
}
