import { ITeamNewsItem } from '@/types/team-news.types';

// Shared by searchedItems' useMemo and handleSearch's synchronous result-count
// computation, so the two never drift into different definitions of "matches".
//
// Leading `#`s are dropped (LAB-3125), so `#ai` finds the stories tagged ai: no
// tag contains a `#`, so a hashtag query used to match nothing.
export function matchesTeamNewsQuery(item: ITeamNewsItem, lowerCaseQuery: string): boolean {
  const q = lowerCaseQuery.replace(/^#+/, '');
  if (!q) return true;
  return (
    item.teamName.toLowerCase().includes(q) ||
    item.title.toLowerCase().includes(q) ||
    (item.summary?.toLowerCase().includes(q) ?? false) ||
    item.tags.some((t) => t.toLowerCase().includes(q))
  );
}
