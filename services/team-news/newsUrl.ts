import type { ITeamNewsItem } from '@/types/team-news.types';

export function isSafeHttpUrl(raw: string): boolean {
  try {
    return ['http:', 'https:'].includes(new URL(raw.trim()).protocol);
  } catch {
    return false;
  }
}

export function deriveDomain(raw: string): string | null {
  try {
    return new URL(raw.trim()).hostname.replace(/^www\./, '') || null;
  } catch {
    return null;
  }
}

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

export function findNewsByUrl(items: ITeamNewsItem[], raw: string): ITeamNewsItem | null {
  const key = normalizeNewsUrl(raw);
  if (!key) return null;
  return (
    items.find((item) =>
      [item.sourceUrl, ...(item.sourceUrls ?? [])].some((candidate) => normalizeNewsUrl(candidate) === key),
    ) ?? null
  );
}

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
