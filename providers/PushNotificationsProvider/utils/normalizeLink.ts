const LEGACY_HOME_PATH = '/home';

/**
 * Normalizes a notification link for comparison with the current pathname.
 * - Handles absolute URLs (https://example.com/path → /path)
 * - Strips query parameters and hash fragments, except `news` so a
 *   `/?news=<uid>` mention is not auto-marked just by being on the homepage
 * - Ensures a leading `/`
 * - Reads `/home` as `/`: the homepage moved to the site root (LAB-3255), and links
 *   sent before that, or still built by the backend, say `/home`
 */
export function normalizeLink(link: string): string {
  let pathname: string | undefined;
  if (/^https?:\/\//i.test(link)) {
    try {
      pathname = new URL(link).pathname;
    } catch {
      pathname = undefined;
    }
  }
  if (!pathname) {
    const pathOnly = link.split('?')[0].split('#')[0];
    pathname = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
  }
  if (pathname === LEGACY_HOME_PATH) pathname = '/';
  const news = /[?&]news=([^&#]*)/.exec(link)?.[1];
  return news ? `${pathname}?news=${news}` : pathname;
}
