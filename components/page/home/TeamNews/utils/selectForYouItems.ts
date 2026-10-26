import type { ITeamNewsItem } from '@/types/team-news.types';

import { sortAllTabItemsByEventDate } from './sortAllTabItemsByEventDate';

/**
 * Latest story per For You team (eventDate, then createdAt).
 *
 * `tags` (News preferences, LAB-3001) also keeps stories from any team that
 * share one of the member's tags, so `teamUids` is then only their own and
 * followed teams. Mirrors the backend's `selectNewsItemsByTagsAndTeams`, so For
 * You and the digest pick the same stories. Omitted = teams only, as before.
 */
export function selectForYouItems(
  items: ITeamNewsItem[],
  teamUids: ReadonlySet<string>,
  tags?: ReadonlySet<string>,
): ITeamNewsItem[] {
  if (teamUids.size === 0 && !tags?.size) return [];

  const seen = new Set<string>();
  const selected: ITeamNewsItem[] = [];
  const candidates = items.filter(
    (i) => teamUids.has(i.teamUid) || (!!tags && (i.tags ?? []).some((tag) => tags.has(tag.trim().toLowerCase()))),
  );
  for (const item of sortAllTabItemsByEventDate(candidates)) {
    if (seen.has(item.teamUid)) continue;
    seen.add(item.teamUid);
    selected.push(item);
  }
  return selected;
}
