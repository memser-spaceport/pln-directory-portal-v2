import type { TeamCluster } from '@/types/team-news.types';

export type TeamNewsSort = 'following' | 'latest' | 'popular';

export const SORT_OPTIONS = [
  { value: 'following', label: 'Following' },
  { value: 'latest', label: 'Latest' },
  { value: 'popular', label: 'Most popular' },
] as const satisfies ReadonlyArray<{ value: TeamNewsSort; label: string }>;

// Ranks by the caller-provided counts (a mount-time snapshot in TeamNews) rather than
// the items' live upvoteCount, so optimistic upvotes never reorder the feed mid-session.
// The item fallback can't fire for TeamNews today (its snapshot covers every uid) but
// keeps the util total for any future caller.
const clusterUpvotes = (c: TeamCluster, counts: ReadonlyMap<string, number>): number =>
  c.items.reduce((max, i) => Math.max(max, counts.get(i.uid) ?? i.upvoteCount ?? 0), 0);

const compareClusterLatest = (a: TeamCluster, b: TeamCluster): number => {
  let aEvent = '';
  let aCreated = '';
  let bEvent = '';
  let bCreated = '';

  for (const i of a.items) {
    if (i.eventDate > aEvent || (i.eventDate === aEvent && i.createdAt > aCreated)) {
      aEvent = i.eventDate;
      aCreated = i.createdAt;
    }
  }
  for (const i of b.items) {
    if (i.eventDate > bEvent || (i.eventDate === bEvent && i.createdAt > bCreated)) {
      bEvent = i.eventDate;
      bCreated = i.createdAt;
    }
  }

  const byEventDate = bEvent.localeCompare(aEvent);
  if (byEventDate !== 0) return byEventDate;
  return bCreated.localeCompare(aCreated);
};

export function sortTeamNewsClusters(
  clusters: TeamCluster[],
  sort: TeamNewsSort,
  followedTeamUids: ReadonlySet<string>,
  upvoteCounts: ReadonlyMap<string, number>,
): TeamCluster[] {
  if (sort === 'popular') {
    return [...clusters].sort((a, b) => clusterUpvotes(b, upvoteCounts) - clusterUpvotes(a, upvoteCounts));
  }

  if (sort === 'latest') {
    return [...clusters].sort(compareClusterLatest);
  }

  // following: followed first, then upvotes within each group
  return [...clusters].sort((a, b) => {
    const followDiff = Number(followedTeamUids.has(b.teamUid)) - Number(followedTeamUids.has(a.teamUid));
    if (followDiff !== 0) return followDiff;
    return clusterUpvotes(b, upvoteCounts) - clusterUpvotes(a, upvoteCounts);
  });
}
