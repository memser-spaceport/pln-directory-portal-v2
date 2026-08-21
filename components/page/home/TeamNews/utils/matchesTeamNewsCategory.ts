import { ITeamNewsItem } from '@/types/team-news.types';

import { ALL_CAT, DISCUSSIONS_CAT, type TeamNewsCategoryId } from '../constants';

import { hasExistingDiscussion } from './hasExistingDiscussion';

// Shared by filteredItems' useMemo and handlePopularItemClick's synchronous
// category-mismatch check, so the two never drift into different definitions
// of "matches" — same rationale as matchesTeamNewsQuery above.
export function matchesTeamNewsCategory(item: ITeamNewsItem, categoryId: TeamNewsCategoryId): boolean {
  if (categoryId === ALL_CAT) return true;
  // A news item counts as a discussion when it has a forum thread of its own.
  // Forum posts also live under this pill, but they aren't news items — see
  // filterFeedForumPosts for that half.
  if (categoryId === DISCUSSIONS_CAT) return hasExistingDiscussion(item.discussion);
  return item.eventType === categoryId;
}
