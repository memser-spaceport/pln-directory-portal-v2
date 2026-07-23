import type { ITeamNewsItem } from '@/types/team-news.types';

/** A source row for the SourceList popover: the article URL plus the display
 *  domain derived from it (the API sends bare `sourceUrls`, no domains). */
export interface NewsSourceLink {
  domain: string;
  url: string;
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
    const domain = url === item.sourceUrl && item.sourceDomain ? item.sourceDomain : deriveDomain(url);
    if (domain) links.push({ domain, url });
  }
  return links;
}

/** Whether the meta line has a source segment to render — drives the caller's
 *  separator dot, mirroring the old `item.sourceDomain &&` condition. */
export const hasNewsSource = (item: ITeamNewsItem): boolean =>
  getNewsSources(item).length > 0 || Boolean(item.sourceDomain);
