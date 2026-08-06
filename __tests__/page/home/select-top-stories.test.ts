import { selectTopStories, TOP_STORIES_TOTAL } from '@/components/page/home/TeamNews/utils/selectTopStories';
import type { ITeamNewsItem } from '@/types/team-news.types';

const makeItem = (uid: string, overrides: Partial<ITeamNewsItem> = {}): ITeamNewsItem => ({
  uid,
  teamUid: `team-${uid}`,
  teamName: `Team ${uid}`,
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

const counts = (entries: Record<string, number>): ReadonlyMap<string, number> => new Map(Object.entries(entries));

/** Ranking cases pass 0 so the corpus gate is out of the way; the function still
 *  floors at TOP_STORIES_TOTAL, which the gating cases below cover. */
const NO_MINIMUM = 0;

describe('selectTopStories', () => {
  it('returns an empty selection for an empty window', () => {
    const result = selectTopStories([], counts({}), NO_MINIMUM);

    expect(result.lead).toBeNull();
    expect(result.also).toEqual([]);
    expect(result.uids.size).toBe(0);
  });

  it('ranks by upvote count, highest first', () => {
    const items = [makeItem('a'), makeItem('b'), makeItem('c'), makeItem('d')];
    const result = selectTopStories(items, counts({ a: 2, b: 40, c: 9, d: 30 }), NO_MINIMUM);

    expect(result.lead?.uid).toBe('b');
    expect(result.also.map((i) => i.uid)).toEqual(['d', 'c']);
  });

  it('takes at most three items, whatever the window size', () => {
    const items = Array.from({ length: 10 }, (_, i) => makeItem(`i${i}`));
    const result = selectTopStories(items, counts({}), NO_MINIMUM);

    expect(result.uids.size).toBe(3);
    expect(result.also).toHaveLength(2);
  });

  it('exposes every picked uid as the exclusion set', () => {
    const items = [makeItem('a'), makeItem('b'), makeItem('c'), makeItem('d')];
    const result = selectTopStories(items, counts({ a: 5, b: 4, c: 3, d: 2 }), NO_MINIMUM);

    expect([...result.uids]).toEqual(['a', 'b', 'c']);
    expect(result.uids.has('d')).toBe(false);
  });

  // The tie-break is what makes a zero-engagement window still produce a
  // sensible block rather than an arbitrary one — see selectTopStories' docblock.
  it('breaks ties on eventDate, most recent first', () => {
    const items = [
      makeItem('old', { eventDate: '2026-05-01T00:00:00.000Z' }),
      makeItem('new', { eventDate: '2026-05-09T00:00:00.000Z' }),
      makeItem('mid', { eventDate: '2026-05-05T00:00:00.000Z' }),
    ];
    const result = selectTopStories(items, counts({ old: 7, new: 7, mid: 7 }), NO_MINIMUM);

    expect([result.lead?.uid, ...result.also.map((i) => i.uid)]).toEqual(['new', 'mid', 'old']);
  });

  it('falls back to pure recency when nothing has been upvoted', () => {
    const items = [
      makeItem('a', { eventDate: '2026-05-02T00:00:00.000Z' }),
      makeItem('b', { eventDate: '2026-05-08T00:00:00.000Z' }),
      makeItem('c', { eventDate: '2026-05-05T00:00:00.000Z' }),
    ];
    const result = selectTopStories(items, counts({}), NO_MINIMUM);

    expect(result.lead?.uid).toBe('b');
    expect(result.also.map((i) => i.uid)).toEqual(['c', 'a']);
  });

  describe('corpus gate', () => {
    // The band sits ABOVE a feed. If it would swallow most of the window there
    // is no feed under it, and the band is just the feed restyled.
    it('renders nothing below the caller-supplied minimum', () => {
      const items = Array.from({ length: 8 }, (_, i) => makeItem(`i${i}`));
      const result = selectTopStories(items, counts({}), 9);

      expect(result.lead).toBeNull();
      expect(result.uids.size).toBe(0);
    });

    it('renders once the minimum is met exactly', () => {
      const items = Array.from({ length: 9 }, (_, i) => makeItem(`i${i}`));
      const result = selectTopStories(items, counts({}), 9);

      expect(result.lead).not.toBeNull();
      expect(result.also).toHaveLength(2);
    });

    // A caller passing 0 (or anything under three) must not get a partial band —
    // the floor is what guarantees `also` is always two rows when `lead` is set.
    it('floors the minimum at the three stories the band needs', () => {
      const twoItems = [makeItem('a'), makeItem('b')];

      expect(selectTopStories(twoItems, counts({}), NO_MINIMUM).lead).toBeNull();
      expect(selectTopStories([makeItem('solo')], counts({}), NO_MINIMUM).lead).toBeNull();
      expect(selectTopStories(twoItems, counts({}), TOP_STORIES_TOTAL).lead).toBeNull();
    });
  });

  // The mount-time snapshot is the whole point: a live count would let an
  // optimistic like re-rank the block under the cursor that just clicked it.
  it('ignores live item upvoteCount in favour of the pinned snapshot', () => {
    const items = [makeItem('a', { upvoteCount: 99 }), makeItem('b', { upvoteCount: 1 }), makeItem('c')];
    const result = selectTopStories(items, counts({ a: 1, b: 50, c: 0 }), NO_MINIMUM);

    expect(result.lead?.uid).toBe('b');
  });

  it('does not mutate the input array', () => {
    const items = [makeItem('a'), makeItem('b'), makeItem('c')];
    const order = items.map((i) => i.uid);
    selectTopStories(items, counts({ c: 10 }), NO_MINIMUM);

    expect(items.map((i) => i.uid)).toEqual(order);
  });
});
