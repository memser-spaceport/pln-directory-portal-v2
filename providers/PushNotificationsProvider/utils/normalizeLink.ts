/**
 * Normalizes a notification link for comparison with the current pathname.
 * - Handles absolute URLs (https://example.com/path → /path)
 * - Strips query parameters and hash fragments, except `news` so a
 *   `/home?news=<uid>` mention is not auto-marked just by being on /home
 * - Ensures a leading `/`
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
  const news = /[?&]news=([^&#]*)/.exec(link)?.[1];
  return news ? `${pathname}?news=${news}` : pathname;
}
