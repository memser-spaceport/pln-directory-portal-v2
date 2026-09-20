import type { ITeamNewsItem } from '@/types/team-news.types';

import { htmlToPlainText } from './newsUrl';

// Link-preview descriptions are clipped by the platform anyway (Slack and X
// both show roughly this much), so cutting at a word boundary just under the
// limit keeps the last word whole instead of letting the platform slice it.
const SNIPPET_MAX_LENGTH = 200;

export function getNewsPreviewSnippet(item: ITeamNewsItem): string {
  const text = item.summary?.trim() || htmlToPlainText(item.contentHtml);

  if (text.length <= SNIPPET_MAX_LENGTH) {
    return text;
  }

  const clipped = text.slice(0, SNIPPET_MAX_LENGTH);
  const lastSpace = clipped.lastIndexOf(' ');

  return `${lastSpace > 0 ? clipped.slice(0, lastSpace) : clipped}…`;
}
