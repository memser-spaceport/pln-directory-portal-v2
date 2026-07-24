import { clusterByTeam } from '@/components/page/home/TeamNews/utils/clusterByTeam';
import { sortTeamNewsClusters } from '@/components/page/home/TeamNews/utils/sortTeamNewsClusters';
import type { ITeamNewsItem } from '@/types/team-news.types';

const makeItem = (
  uid: string,
  teamUid: string,
  teamName: string,
  overrides: Partial<ITeamNewsItem> = {},
): ITeamNewsItem => ({
  uid,
  teamUid,
  teamName,
  teamLogoUrl: null,
  eventType: 'ANNOUNCEMENT',
  eventDate: '2026-05-01T12:00:00.000Z',
  title: `Headline ${uid}`,
  summary: null,
  sourceUrl: `https://example.com/${uid}`,
  sourceDomain: 'example.com',
  tags: [],
  focusAreas: [],
  subFocusAreas: [],
  createdAt: '2026-05-01T12:00:00.000Z',
  discussion: { count: 0, latestTopicUrl: null },
  ...overrides,
});

const teamOrder = (clusters: ReturnType<typeof clusterByTeam>) => clusters.map((c) => c.teamUid);

const NO_FOLLOWS: ReadonlySet<string> = new Set();

describe('sortTeamNewsClusters', () => {
  // Live item counts say beta > alpha, but the counts map pins the page-load
  // ranking (alpha 5, beta 1) — the map must win, or an optimistic upvote
  // written into the items would reorder the feed mid-session.
  const alpha = makeItem('a-1', 'team-alpha', 'Alpha', { upvoteCount: 6 });
  const beta = makeItem('b-1', 'team-beta', 'Beta', { upvoteCount: 9 });
  const pinnedCounts: ReadonlyMap<string, number> = new Map([
    ['a-1', 5],
    ['b-1', 1],
  ]);

  describe("'popular'", () => {
    it('ranks by the passed counts map, not the items’ live upvoteCount', () => {
      const clusters = clusterByTeam([beta, alpha]); // insertion order would put beta first
      const sorted = sortTeamNewsClusters(clusters, 'popular', NO_FOLLOWS, pinnedCounts);
      expect(teamOrder(sorted)).toEqual(['team-alpha', 'team-beta']);
    });

    it('respects a 0 in the map over a positive item count (?? not ||)', () => {
      const zeroed = makeItem('z-1', 'team-zeta', 'Zeta', { upvoteCount: 100 });
      const one = makeItem('o-1', 'team-omega', 'Omega', { upvoteCount: 0 });
      const counts: ReadonlyMap<string, number> = new Map([
        ['z-1', 0],
        ['o-1', 1],
      ]);
      const sorted = sortTeamNewsClusters(clusterByTeam([zeroed, one]), 'popular', NO_FOLLOWS, counts);
      expect(teamOrder(sorted)).toEqual(['team-omega', 'team-zeta']);
    });

    it('falls back to the item’s upvoteCount (then 0) for a uid absent from the map', () => {
      const known = makeItem('k-1', 'team-known', 'Known', { upvoteCount: 1 });
      const unknownCounted = makeItem('u-1', 'team-unknown', 'Unknown', { upvoteCount: 3 });
      const unknownBare = makeItem('n-1', 'team-none', 'None'); // no upvoteCount at all → 0
      const counts: ReadonlyMap<string, number> = new Map([['k-1', 2]]);
      const sorted = sortTeamNewsClusters(
        clusterByTeam([known, unknownCounted, unknownBare]),
        'popular',
        NO_FOLLOWS,
        counts,
      );
      expect(teamOrder(sorted)).toEqual(['team-unknown', 'team-known', 'team-none']);
    });
  });

  describe("'following'", () => {
    it('keeps followed-first partitioning, then tie-breaks within each group by the counts map', () => {
      const followedLow = makeItem('f-1', 'team-followed', 'Followed', { upvoteCount: 0 });
      const clusters = clusterByTeam([beta, alpha, followedLow]);
      const counts = new Map(pinnedCounts).set('f-1', 0);
      const sorted = sortTeamNewsClusters(clusters, 'following', new Set(['team-followed']), counts);
      expect(teamOrder(sorted)).toEqual(['team-followed', 'team-alpha', 'team-beta']);
    });
  });

  describe("'latest'", () => {
    it('orders by event date and ignores the counts map entirely', () => {
      const older = makeItem('old-1', 'team-old', 'Old', {
        eventDate: '2026-04-01T12:00:00.000Z',
        upvoteCount: 0,
      });
      const newer = makeItem('new-1', 'team-new', 'New', {
        eventDate: '2026-06-01T12:00:00.000Z',
        upvoteCount: 0,
      });
      // Map ranks the older story far higher — must not matter under 'latest'.
      const counts: ReadonlyMap<string, number> = new Map([
        ['old-1', 999],
        ['new-1', 0],
      ]);
      const sorted = sortTeamNewsClusters(clusterByTeam([older, newer]), 'latest', NO_FOLLOWS, counts);
      expect(teamOrder(sorted)).toEqual(['team-new', 'team-old']);
    });
  });
});
