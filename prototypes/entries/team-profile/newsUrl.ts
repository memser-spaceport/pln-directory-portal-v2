import type { ITeamNewsItem } from '@/types/team-news.types';

/**
 * Link handling for team-posted news — the one field the compose form has to
 * reason about rather than just carry.
 *
 * Same scheme allowlist as production's `getNewsSources`: a link the form
 * accepts becomes an <a href> on the card, so `javascript:` never gets through.
 */
export function isSafeHttpUrl(raw: string): boolean {
  try {
    return ['http:', 'https:'].includes(new URL(raw.trim()).protocol);
  } catch {
    return false;
  }
}

/** Display domain, the way the API computes `sourceDomain` for enriched items. */
export function deriveDomain(raw: string): string | null {
  try {
    return new URL(raw.trim()).hostname.replace(/^www\./, '') || null;
  } catch {
    return null;
  }
}

/**
 * The identity of a link for the duplicate check. Two people pasting the same
 * announcement rarely paste the same string — one has `www.`, one a trailing
 * slash, one the `?utm_source=` their mail client added — so the comparison
 * runs on host + path + the query minus tracking, never on the raw string.
 * Returns null for anything that isn't an http(s) URL.
 */
export function normalizeNewsUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (!['http:', 'https:'].includes(url.protocol)) return null;

  const params = new URLSearchParams(url.search);
  for (const key of Array.from(params.keys())) {
    if (/^utm_/i.test(key) || ['ref', 'fbclid', 'gclid', 'mc_cid', 'mc_eid'].includes(key.toLowerCase())) {
      params.delete(key);
    }
  }
  params.sort();
  const query = params.toString();

  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  const path = url.pathname.replace(/\/+$/, '');
  return `${host}${path}${query ? `?${query}` : ''}`;
}

/**
 * The story already carrying this link, if any. Checks every outlet URL on an
 * item, not only the primary one, because an aggregated story lists the same
 * announcement under several `sourceUrls`.
 */
export function findNewsByUrl(items: ITeamNewsItem[], raw: string): ITeamNewsItem | null {
  const key = normalizeNewsUrl(raw);
  if (!key) return null;
  return (
    items.find((item) =>
      [item.sourceUrl, ...(item.sourceUrls ?? [])].some((candidate) => normalizeNewsUrl(candidate) === key),
    ) ?? null
  );
}

/** Plain-text teaser for the card, from the editor's HTML body. */
export function htmlToPlainText(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/<\/(p|div|li|h[1-6])>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
