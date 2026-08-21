import type { ITeamNewsItem } from '@/types/team-news.types';

import { sortAllTabItemsByEventDate } from './sortAllTabItemsByEventDate';

/** Latest story per For You team (eventDate, then createdAt). */
export function selectForYouItems(items: ITeamNewsItem[], teamUids: ReadonlySet<string>): ITeamNewsItem[] {
  if (teamUids.size === 0) return [];

  const seen = new Set<string>();
  const selected: ITeamNewsItem[] = [];
  for (const item of sortAllTabItemsByEventDate(items.filter((i) => teamUids.has(i.teamUid)))) {
    if (seen.has(item.teamUid)) continue;
    seen.add(item.teamUid);
    selected.push(item);
  }
  return selected;
}
