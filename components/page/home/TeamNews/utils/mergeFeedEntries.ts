import type { TeamCluster } from '@/types/team-news.types';
import type { IFeedForumPost } from '@/types/feed.types';
import type { IJobTeamGroup } from '@/types/jobs.types';
import type { IDeal } from '@/types/deals.types';
import type { TeamNewsSort } from './sortTeamNewsClusters';

// Client-derived view shape (like TeamCluster, unlike the I-prefixed wire types
// in types/feed.types.ts) — lives here with the merge that produces it.
//
// 'news' and 'forum' are the RANKED kinds: they carry both a date and a like
// count, so mergeFeedEntries below can order them against each other under
// every sort mode. 'hiring' and 'deal' are supporting kinds with no popularity
// signal at all — they are never ranked, only slotted, which is why they enter
// through injectFeedSignals as a separate pass and not through this file's
// merge. See that file's docblock for why that distinction matters.
export type FeedEntry =
  | { kind: 'news'; cluster: TeamCluster }
  | { kind: 'forum'; post: IFeedForumPost }
  | { kind: 'hiring'; group: IJobTeamGroup }
  | { kind: 'deal'; deal: IDeal };

/** The kinds this file ranks. Everything else is slotted in afterwards. */
export type RankedFeedEntry = Extract<FeedEntry, { kind: 'news' } | { kind: 'forum' }>;

export function isRankedEntry(entry: FeedEntry): entry is RankedFeedEntry {
  return entry.kind === 'news' || entry.kind === 'forum';
}

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
    case 'hiring':
      return `hiring:${entry.group.team.uid}`;
    case 'deal':
      return `deal:${entry.deal.uid}`;
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
 * Posts are ranked by the same measure as the mode they join ('popular' →
 * likeCount vs the cluster upvote snapshot; 'latest' / 'following' →
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
 * Slot-2 rule (prototype parity), under 'popular' and 'following' ONLY: the
 * first news entry stays first and the best-ranked forum post is pulled to
 * position 2, so the news + discussion mix reads immediately. It is skipped
 * under 'latest' — see the guard below for why.
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
}): RankedFeedEntry[] {
  const newsEntries: RankedFeedEntry[] = sortedClusters.map((cluster) => ({ kind: 'news', cluster }));
  if (!forumPosts || forumPosts.length === 0) return newsEntries;

  // A post outranks a cluster when the cluster ranks strictly below it — ties
  // keep news first (posts join the feed; they don't displace equals).
  const postOutranksCluster = (post: IFeedForumPost, cluster: TeamCluster): boolean => {
    if (sort === 'popular') return clusterUpvotes(cluster, upvoteCounts) < post.likeCount;
    // 'latest', and the unfollowed tail of 'following', both rank by date.
    return clusterLatestEventDate(cluster) < post.createdAt;
  };

  const rankedPosts = [...forumPosts].sort((a, b) =>
    sort === 'popular' ? b.likeCount - a.likeCount : b.createdAt.localeCompare(a.createdAt),
  );

  const merged: RankedFeedEntry[] = [];
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

  // Slot-2 rule — never under 'latest'. Position 2 promises relevance under
  // 'popular' and 'following', so a promotion there costs nothing the mode
  // claimed. Under 'latest' the promise IS recency: pulling a post over fresher
  // clusters puts an 11-day-old discussion between a 3-day and a 4-day story,
  // which reads as a broken sort no matter why it was placed there. Guard sits
  // AFTER the merge loop on purpose — the loop's date ranking is correct; only
  // this post-hoc promotion was wrong.
  if (sort === 'latest') return merged;

  const firstNewsIdx = merged.findIndex((e) => e.kind === 'news');
  const firstForumIdx = merged.findIndex((e) => e.kind === 'forum');
  if (firstNewsIdx === -1 || firstForumIdx === -1) return merged;
  const firstNews = merged[firstNewsIdx];
  const firstForum = merged[firstForumIdx];
  return [firstNews, firstForum, ...merged.filter((e) => e !== firstNews && e !== firstForum)];
}
