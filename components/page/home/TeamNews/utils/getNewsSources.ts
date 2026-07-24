import type { ITeamNewsItem } from '@/types/team-news.types';

/** A source row for the SourceList popover: the article URL plus the display
 *  domain derived from it (the API sends bare `sourceUrls`, no domains). */
export interface NewsSourceLink {
  domain: string;
  url: string;
}

// Scheme allowlist, not just "parses as a URL": source URLs come from the AI
// enrichment pipeline — the least trusted strings on the page — and something
// like `javascript://host/%0aalert(1)` has a non-empty hostname yet must never
// become an <a href> or a window.open target.
function isSafeHttpUrl(url: string): boolean {
  try {
    return ['http:', 'https:'].includes(new URL(url).protocol);
  } catch {
    return false;
  }
}

function deriveDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '') || null;
  } catch {
    // Malformed entry from enrichment — drop it rather than render a broken row.
    return null;
  }
}

/** Maps the item's `sourceUrls` to displayable {domain, url} rows, in API
 *  order. The primary entry (matching `sourceUrl`) keeps the backend-computed
 *  `sourceDomain` so single- and multi-source renders never disagree. */
export function getNewsSources(item: ITeamNewsItem): NewsSourceLink[] {
  const links: NewsSourceLink[] = [];
  for (const url of item.sourceUrls ?? []) {
    if (!isSafeHttpUrl(url)) continue;
    const domain = url === item.sourceUrl && item.sourceDomain ? item.sourceDomain : deriveDomain(url);
    if (domain) links.push({ domain, url });
  }
  return links;
}

/** Whether the meta line has a source segment to render — drives the caller's
 *  separator dot, mirroring the old `item.sourceDomain &&` condition. */
export const hasNewsSource = (item: ITeamNewsItem): boolean =>
  getNewsSources(item).length > 0 || Boolean(item.sourceDomain);

/** Detail-modal variant: most items today carry only the single sourceUrl
 *  (`sourceUrls` is the pending multi-source API field), and the modal is now
 *  the only place the article link is reachable from — so fall back to the
 *  primary URL when the array is absent. Same scheme allowlist applies. */
export function getNewsSourcesWithPrimaryFallback(item: ITeamNewsItem): NewsSourceLink[] {
  const links = getNewsSources(item);
  if (links.length > 0 || !item.sourceUrl || !isSafeHttpUrl(item.sourceUrl)) return links;
  const domain = item.sourceDomain || deriveDomain(item.sourceUrl);
  return domain ? [{ domain, url: item.sourceUrl }] : [];
}
