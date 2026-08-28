import type { IFeedForumPost } from '@/types/feed.types';
import { ALL_CAT, ALL_TAB, DISCUSSIONS_CAT, FOR_YOU_CAT, type TeamNewsCategoryId } from '../constants';

import { createdWithinWindow } from './feedForumPostWindow';

// Where a forum post can appear: under "All categories", "Discussions", or
// "For You" (a post has no event type, so every event-type pill necessarily
// excludes it), scoped to the focus-area tabs the post is tagged with, then
// narrowed by the same free-text search as news.
//
// For You is a further cut — posted in the last 7 days — applied by
// selectForYouForumPosts, not here. All / Discussions keep the 14-day activity
// window the feed already applied.
//
// NodeBB has no focus areas, so `focusAreas` is empty in practice and posts only
// surface on the All tab. That's also why the Discussions pill hides itself on a
// focus tab: its count there is zero, which is how the pill has always behaved
// when nothing matches.

export function matchesFeedForumPost(post: IFeedForumPost, tab: string, lowerCaseQuery: string): boolean {
  if (tab !== ALL_TAB && !post.focusAreas.includes(tab)) return false;
  if (!lowerCaseQuery) return true;
  return (
    post.author.name.toLowerCase().includes(lowerCaseQuery) ||
    post.title.toLowerCase().includes(lowerCaseQuery) ||
    post.body.toLowerCase().includes(lowerCaseQuery) ||
    post.category.toLowerCase().includes(lowerCaseQuery)
  );
}

/** Does this category show forum posts at all? */
export function categoryIncludesForumPosts(category: TeamNewsCategoryId): boolean {
  return category === ALL_CAT || category === DISCUSSIONS_CAT || category === FOR_YOU_CAT;
}

export function filterFeedForumPosts(
  posts: IFeedForumPost[] | undefined,
  filters: { tab: string; category: TeamNewsCategoryId; query: string },
): IFeedForumPost[] {
  if (!posts || !categoryIncludesForumPosts(filters.category)) return [];
  const q = filters.query.trim().toLowerCase();
  return posts.filter((p) => matchesFeedForumPost(p, filters.tab, q));
}

/** Forum posts that join For You: created at or after `cutoffIso`, then the
 *  same tab/search matching All uses. The cutoff is required so a caller can't
 *  accidentally dump the 14-day activity window onto the personalised tab. */
export function selectForYouForumPosts(
  posts: IFeedForumPost[] | undefined,
  cutoffIso: string,
  filters: { tab: string; query: string },
): IFeedForumPost[] {
  return filterFeedForumPosts(createdWithinWindow(posts, cutoffIso), {
    tab: filters.tab,
    category: FOR_YOU_CAT,
    query: filters.query,
  });
}
