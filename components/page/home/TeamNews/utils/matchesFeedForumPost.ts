import type { IFeedForumPost } from '@/types/feed.types';
import { ALL_CAT, ALL_TAB, type TeamNewsCategoryId } from '../constants';

// Prototype semantics (NewsfeedV0Prototype's forumPosts memo): posts join the
// feed only under the "All" category pill (a post has no event type, so any
// event filter necessarily excludes it — including Active Discussions, which
// counts NodeBB-linked news, a separate system from feed comments), scoped to
// the focus-area tabs the post is tagged with, then narrowed by the same
// free-text search as news.

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

export function filterFeedForumPosts(
  posts: IFeedForumPost[] | undefined,
  filters: { tab: string; category: TeamNewsCategoryId; query: string },
): IFeedForumPost[] {
  if (!posts || filters.category !== ALL_CAT) return [];
  const q = filters.query.trim().toLowerCase();
  return posts.filter((p) => matchesFeedForumPost(p, filters.tab, q));
}
