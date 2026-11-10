import { ITeamNewsItem } from '@/types/team-news.types';

import { ALL_CAT, DISCUSSIONS_CAT, TOP_CAT, type TeamNewsCategoryId } from '../constants';

import { hasExistingDiscussion } from './hasExistingDiscussion';
import { isEditorialRank } from './selectTopStories';

// Shared by filteredItems' useMemo and handlePopularItemClick's synchronous
// category-mismatch check, so the two never drift into different definitions
// of "matches" — same rationale as matchesTeamNewsQuery above.
export function matchesTeamNewsCategory(item: ITeamNewsItem, categoryId: TeamNewsCategoryId): boolean {
  if (categoryId === ALL_CAT) return true;
  // A news item counts as a discussion when it has a forum thread of its own.
  // Forum posts also live under this pill, but they aren't news items — see
  // filterFeedForumPosts for that half.
  if (categoryId === DISCUSSIONS_CAT) return hasExistingDiscussion(item.discussion);
  // The editorial top stories (LAB-3125, LAB-3202): ranks 1–5.
  if (categoryId === TOP_CAT) return isEditorialRank(item.editorialRank);
  return item.eventType === categoryId;
}

/**
 * The new Home's stream (LAB-3125): as above, except that Discussions holds forum posts only. A news story with a
 * forum thread stays a story there, under All and its own type.
 */
export function matchesStreamNewsCategory(item: ITeamNewsItem, categoryId: TeamNewsCategoryId): boolean {
  if (categoryId === DISCUSSIONS_CAT) return false;
  return matchesTeamNewsCategory(item, categoryId);
}
