import type { TeamCluster } from '@/types/team-news.types';

export type TeamNewsSort = 'following' | 'latest' | 'popular';

// The sort the feed opens on. Named rather than a literal in TeamNews so the default
// sits beside the options it selects from, and so tests can assert against it instead
// of the dropdown's label text (the trigger renders the CURRENT sort, so a hardcoded
// label silently couples every menu-opening helper to whatever the default happens to be).
export const DEFAULT_TEAM_NEWS_SORT: TeamNewsSort = 'latest';

// Ordered default-first: the menu should read the way the control opens.
export const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest' },
  { value: 'following', label: 'Following' },
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

  // following: followed first, then latest date within each group
  return [...clusters].sort((a, b) => {
    const followDiff = Number(followedTeamUids.has(b.teamUid)) - Number(followedTeamUids.has(a.teamUid));
    if (followDiff !== 0) return followDiff;
    return compareClusterLatest(a, b);
  });
}
