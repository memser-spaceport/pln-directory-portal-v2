import type { ITeamNewsItem, ITeamNewsPrompt } from '@/types/team-news.types';

/** How many "Try asking" prompts the AI Search new-chat page shows. */
export const NEWS_PROMPT_COUNT = 4;

/**
 * How many of the newest stories the prompts are picked from. The Top Stories
 * picks are usually among them; a pick older than this page is not offered.
 */
export const NEWS_PROMPT_CANDIDATE_LIMIT = 20;

function isEditorialRank(rank: number | null | undefined): rank is number {
  return typeof rank === 'number' && rank >= 1;
}

function eventTime(item: ITeamNewsItem): number {
  const time = Date.parse(item.eventDate ?? item.createdAt);
  return Number.isNaN(time) ? 0 : time;
}

export function buildNewsPromptQuestion(item: Pick<ITeamNewsItem, 'teamName' | 'title'>): string {
  return `What is the news from ${item.teamName}: "${item.title.trim()}"?`;
}

/**
 * The "Try asking" prompts for the AI Search new-chat page (LAB-3012), from the
 * newest stories: the Top Stories picks among them first, in editorial order,
 * then the rest by recency. Each story appears once. No news, or a failed
 * request, gives no prompts, and the page then hides the block.
 */
export function selectNewsPrompts(
  items: ITeamNewsItem[] | null | undefined,
  count: number = NEWS_PROMPT_COUNT,
): ITeamNewsPrompt[] {
  const byUid = new Map<string, ITeamNewsItem>();
  for (const item of items ?? []) {
    if (item?.uid && item.title?.trim() && item.teamName && !byUid.has(item.uid)) {
      byUid.set(item.uid, item);
    }
  }

  return Array.from(byUid.values())
    .sort((a, b) => {
      const aRanked = isEditorialRank(a.editorialRank);
      const bRanked = isEditorialRank(b.editorialRank);
      if (aRanked && bRanked) return (a.editorialRank as number) - (b.editorialRank as number);
      if (aRanked !== bRanked) return aRanked ? -1 : 1;
      return eventTime(b) - eventTime(a);
    })
    .slice(0, count)
    .map((item) => ({ uid: item.uid, question: buildNewsPromptQuestion(item) }));
}
