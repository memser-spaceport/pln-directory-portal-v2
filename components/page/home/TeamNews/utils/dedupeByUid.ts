import type { ITeamNewsItem } from '@/types/team-news.types';

export const dedupeByUid = (items: ITeamNewsItem[]): ITeamNewsItem[] => {
  const seen = new Set<string>();
  const out: ITeamNewsItem[] = [];
  for (const item of items) {
    if (seen.has(item.uid)) continue;
    seen.add(item.uid);
    out.push(item);
  }
  return out;
};
