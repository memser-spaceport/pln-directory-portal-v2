import type { ITeamNewsItem } from '@/types/team-news.types';

import { sortAllTabItemsByEventDate } from './sortAllTabItemsByEventDate';

/**
 * Latest story per For You team (eventDate, then createdAt).
 *
 * `categories` (News preferences, LAB-2941) keeps only news in those
 * categories, before the latest-per-team pick: a team whose newest story is in
 * a category the member turned off shows its latest story in one they kept,
 * as the digest does. Omitted = every category.
 */
export function selectForYouItems(
  items: ITeamNewsItem[],
  teamUids: ReadonlySet<string>,
  categories?: ReadonlySet<string>,
): ITeamNewsItem[] {
  if (teamUids.size === 0) return [];

  const seen = new Set<string>();
  const selected: ITeamNewsItem[] = [];
  const candidates = items.filter((i) => teamUids.has(i.teamUid) && (!categories || categories.has(i.eventType)));
  for (const item of sortAllTabItemsByEventDate(candidates)) {
    if (seen.has(item.teamUid)) continue;
    seen.add(item.teamUid);
    selected.push(item);
  }
  return selected;
}
