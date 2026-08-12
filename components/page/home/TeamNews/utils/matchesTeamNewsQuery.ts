import { ITeamNewsItem } from '@/types/team-news.types';

// Shared by searchedItems' useMemo and handleSearch's synchronous result-count
// computation, so the two never drift into different definitions of "matches".
export function matchesTeamNewsQuery(item: ITeamNewsItem, lowerCaseQuery: string): boolean {
  if (!lowerCaseQuery) return true;
  return (
    item.teamName.toLowerCase().includes(lowerCaseQuery) ||
    item.title.toLowerCase().includes(lowerCaseQuery) ||
    (item.summary?.toLowerCase().includes(lowerCaseQuery) ?? false) ||
    item.tags.some((t) => t.toLowerCase().includes(lowerCaseQuery))
  );
}
