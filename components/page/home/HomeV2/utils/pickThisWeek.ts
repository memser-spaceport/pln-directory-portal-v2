import type { ITeamNewsItem } from '@/types/team-news.types';
import { isForumPostUid } from '@/types/feed.types';
import { dedupeByUid } from '@/components/page/home/TeamNews/utils/dedupeByUid';
import { isEditorialRank } from '@/components/page/home/TeamNews/utils/selectTopStories';
import { sortAllTabItemsByEventDate } from '@/components/page/home/TeamNews/utils/sortAllTabItemsByEventDate';

/** The ordering helper's default when a caller does not pass a count. */
export const THIS_WEEK_COUNT = 3;

/**
 * Stories mounted on the signed-out Home so the list can grow to the sidebar.
 * The column cut hides the ones that do not fit. Same cap as the signed-in stream.
 */
export const THIS_WEEK_RENDER_MAX = 24;

/** News only: no hiring roll-ups, no deals, no forum posts. */
const isNewsStory = (item: ITeamNewsItem) =>
  item.eventType !== 'HIRING' && item.eventType !== 'DEALS' && !isForumPostUid(item.uid);

/**
 * The signed-out Home's stories: the editorial top stories (rank 1–5) in rank
 * order, topped up with the newest stories not already chosen. The page mounts `THIS_WEEK_RENDER_MAX` and
 * cuts the list to the sidebar.
 *
 * Unlike `selectTopStories`, it doesn't need every rank or a minimum corpus: one or two ranked stories still
 * lead, and with none ranked the three newest show.
 */
export function pickThisWeek(items: ITeamNewsItem[], count: number = THIS_WEEK_COUNT): ITeamNewsItem[] {
  const pool = dedupeByUid(items).filter(isNewsStory);

  const ranked = pool
    .filter((item) => isEditorialRank(item.editorialRank))
    .sort((a, b) => (a.editorialRank as number) - (b.editorialRank as number))
    .slice(0, count);
  const picked = new Set(ranked.map((item) => item.uid));

  const newest = sortAllTabItemsByEventDate(pool.filter((item) => !picked.has(item.uid)));

  return [...ranked, ...newest].slice(0, count);
}
