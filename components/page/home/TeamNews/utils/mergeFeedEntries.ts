import type { TeamCluster } from '@/types/team-news.types';
import type { IFeedForumPost } from '@/types/feed.types';
import type { TeamNewsSort } from './sortTeamNewsClusters';

// Client-derived view shape (like TeamCluster, unlike the I-prefixed wire types
// in types/feed.types.ts) — lives here with the merge that produces it.
export type FeedEntry = { kind: 'news'; cluster: TeamCluster } | { kind: 'forum'; post: IFeedForumPost };

export function assertNever(x: never): never {
  throw new Error(`Unexpected feed entry kind: ${JSON.stringify(x)}`);
}

// One definition for React keys, slot-rule filtering, and position math —
// three ad-hoc ternaries would drift.
export function feedEntryKey(entry: FeedEntry): string {
  switch (entry.kind) {
    case 'news':
      return `news:${entry.cluster.teamUid}`;
    case 'forum':
      return `forum:${entry.post.uid}`;
    default:
      return assertNever(entry);
  }
}

// Mirrors sortTeamNewsClusters' popular measure (same snapshot map) so a post
// and the cluster it's compared against are ranked by the same currency.
const clusterUpvotes = (c: TeamCluster, counts: ReadonlyMap<string, number>): number =>
  c.items.reduce((max, i) => Math.max(max, counts.get(i.uid) ?? i.upvoteCount ?? 0), 0);

const clusterLatestEventDate = (c: TeamCluster): string =>
  c.items.reduce((max, i) => (i.eventDate > max ? i.eventDate : max), '');

/**
 * Interleaves forum posts into the already-sorted cluster list. DELEGATES to
 * sortTeamNewsClusters' ordering: clusters are never re-sorted, so news-vs-news
 * order is byte-identical to the pre-feature feed under every sort mode —
 * "existing behavior unchanged" is a structural property here, not a hope.
 *
 * Posts are ranked by the same measure as the mode they join ('popular' /
 * 'following' → likeCount vs the cluster upvote snapshot; 'latest' →
 * createdAt vs the cluster's max eventDate — the documented cross-kind
 * semantic) and inserted before the first cluster that ranks below them.
 * Under 'following', posts are never "followed", so they only interleave
 * within the unfollowed tail.
 *
 * `forumPosts` undefined ⇒ news-only entries (posts not loaded / no access /
 * error — the typed shape of the accepted pop-in). The posts query is
 * session-frozen and like optimism never touches it, so this merge is
 * deterministic after the single arrival — the feed never re-sorts mid-session.
 *
 * Slot-2 rule (prototype parity): the first news entry stays first and the
 * best-ranked forum post is pulled to position 2, so the news + discussion mix
 * reads immediately.
 */
export function mergeFeedEntries({
  sortedClusters,
  forumPosts,
  sort,
  followedTeamUids,
  upvoteCounts,
}: {
  sortedClusters: TeamCluster[];
  forumPosts: IFeedForumPost[] | undefined;
  sort: TeamNewsSort;
  followedTeamUids: ReadonlySet<string>;
  upvoteCounts: ReadonlyMap<string, number>;
}): FeedEntry[] {
  const newsEntries: FeedEntry[] = sortedClusters.map((cluster) => ({ kind: 'news', cluster }));
  if (!forumPosts || forumPosts.length === 0) return newsEntries;

  // A post outranks a cluster when the cluster ranks strictly below it — ties
  // keep news first (posts join the feed; they don't displace equals).
  const postOutranksCluster = (post: IFeedForumPost, cluster: TeamCluster): boolean => {
    if (sort === 'latest') return clusterLatestEventDate(cluster) < post.createdAt;
    // 'popular', and the unfollowed tail of 'following', both rank by votes.
    return clusterUpvotes(cluster, upvoteCounts) < post.likeCount;
  };

  const rankedPosts = [...forumPosts].sort((a, b) =>
    sort === 'latest' ? b.createdAt.localeCompare(a.createdAt) : b.likeCount - a.likeCount,
  );

  const merged: FeedEntry[] = [];
  let postIndex = 0;
  for (const cluster of sortedClusters) {
    const clusterIsFollowed = sort === 'following' && followedTeamUids.has(cluster.teamUid);
    while (
      postIndex < rankedPosts.length &&
      !clusterIsFollowed && // posts never precede a followed cluster
      postOutranksCluster(rankedPosts[postIndex], cluster)
    ) {
      merged.push({ kind: 'forum', post: rankedPosts[postIndex++] });
    }
    merged.push({ kind: 'news', cluster });
  }
  while (postIndex < rankedPosts.length) {
    merged.push({ kind: 'forum', post: rankedPosts[postIndex++] });
  }

  // Slot-2 rule.
  const firstNewsIdx = merged.findIndex((e) => e.kind === 'news');
  const firstForumIdx = merged.findIndex((e) => e.kind === 'forum');
  if (firstNewsIdx === -1 || firstForumIdx === -1) return merged;
  const firstNews = merged[firstNewsIdx];
  const firstForum = merged[firstForumIdx];
  return [firstNews, firstForum, ...merged.filter((e) => e !== firstNews && e !== firstForum)];
}
