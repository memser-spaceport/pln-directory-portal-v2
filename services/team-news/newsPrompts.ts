import type { ITeamNewsGroupedResponse, ITeamNewsItem, ITeamNewsPrompt } from '@/types/team-news.types';

/** How many "Try asking" prompts the AI Search new-chat page shows. */
export const NEWS_PROMPT_COUNT = 4;

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
 * The "Try asking" prompts for the AI Search new-chat page (LAB-3012): the news
 * feed's Top Stories picks first, in editorial order, then the newest stories.
 * Each story appears once. No news, or a failed request, gives no prompts, and
 * the page then hides the block.
 */
export function selectNewsPrompts(
  response: ITeamNewsGroupedResponse | null | undefined,
  count: number = NEWS_PROMPT_COUNT,
): ITeamNewsPrompt[] {
  const all = [
    ...(response?.groups ?? []).flatMap((group) => group.items ?? []),
    ...(response?.allTabExtraItems ?? []),
  ];

  const byUid = new Map<string, ITeamNewsItem>();
  for (const item of all) {
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
