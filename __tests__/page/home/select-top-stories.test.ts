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

/** Ranking cases pass 0 so the corpus gate is out of the way; the function still
 *  floors at TOP_STORIES_TOTAL, which the gating cases below cover. */
const NO_MINIMUM = 0;

const withEditorial = (items: ITeamNewsItem[], ranks: Record<string, number>): ITeamNewsItem[] =>
  items.map((item) => (ranks[item.uid] != null ? { ...item, editorialRank: ranks[item.uid] } : item));

describe('selectTopStories', () => {
  it('returns an empty selection for an empty window', () => {
    const result = selectTopStories([], NO_MINIMUM);

    expect(result.lead).toBeNull();
    expect(result.also).toEqual([]);
    expect(result.uids.size).toBe(0);
  });

  it('ranks by editorialRank, lowest first (1 = lead)', () => {
    const items = withEditorial([makeItem('a'), makeItem('b'), makeItem('c'), makeItem('d')], {
      a: 3,
      b: 1,
      c: 2,
      d: 99,
    });
    const result = selectTopStories(items, NO_MINIMUM);

    expect(result.lead?.uid).toBe('b');
    expect(result.also.map((i) => i.uid)).toEqual(['c', 'a']);
  });

  it('takes at most three editorial items', () => {
    const items = Array.from({ length: 10 }, (_, i) => makeItem(`i${i}`, { editorialRank: i < 5 ? i + 1 : null }));
    const result = selectTopStories(items, NO_MINIMUM);

    expect(result.uids.size).toBe(3);
    expect(result.also).toHaveLength(2);
    expect(result.lead?.uid).toBe('i0');
    expect(result.also.map((i) => i.uid)).toEqual(['i1', 'i2']);
  });

  it('exposes every picked uid as the exclusion set', () => {
    const items = withEditorial([makeItem('a'), makeItem('b'), makeItem('c'), makeItem('d')], {
      a: 1,
      b: 2,
      c: 3,
    });
    const result = selectTopStories(items, NO_MINIMUM);

    expect([...result.uids]).toEqual(['a', 'b', 'c']);
    expect(result.uids.has('d')).toBe(false);
  });

  it('ignores upvote counts entirely', () => {
    const items = withEditorial(
      [makeItem('a', { upvoteCount: 99 }), makeItem('b', { upvoteCount: 1 }), makeItem('c', { upvoteCount: 50 })],
      { a: 2, b: 1, c: 3 },
    );
    const result = selectTopStories(items, NO_MINIMUM);

    expect(result.lead?.uid).toBe('b');
    expect(result.also.map((i) => i.uid)).toEqual(['a', 'c']);
  });

  it('hides the band when fewer than three editorial picks exist', () => {
    const items = withEditorial([makeItem('a'), makeItem('b'), makeItem('c'), makeItem('d')], {
      a: 1,
      b: 2,
    });
    const result = selectTopStories(items, NO_MINIMUM);

    expect(result.lead).toBeNull();
    expect(result.uids.size).toBe(0);
  });

  it('hides the band when no editorial ranks are set', () => {
    const items = [makeItem('a'), makeItem('b'), makeItem('c')];
    const result = selectTopStories(items, NO_MINIMUM);

    expect(result.lead).toBeNull();
  });

  describe('corpus gate', () => {
    // The band sits ABOVE a feed. If it would swallow most of the window there
    // is no feed under it, and the band is just the feed restyled.
    it('renders nothing below the caller-supplied minimum', () => {
      const items = withEditorial(
        Array.from({ length: 8 }, (_, i) => makeItem(`i${i}`)),
        { i0: 1, i1: 2, i2: 3 },
      );
      const result = selectTopStories(items, 9);

      expect(result.lead).toBeNull();
      expect(result.uids.size).toBe(0);
    });

    it('renders once the minimum is met exactly', () => {
      const items = withEditorial(
        Array.from({ length: 9 }, (_, i) => makeItem(`i${i}`)),
        { i0: 1, i1: 2, i2: 3 },
      );
      const result = selectTopStories(items, 9);

      expect(result.lead).not.toBeNull();
      expect(result.also).toHaveLength(2);
    });

    // A caller passing 0 (or anything under three) must not get a partial band —
    // the floor is what guarantees `also` is always two rows when `lead` is set.
    it('floors the minimum at the three stories the band needs', () => {
      const twoItems = withEditorial([makeItem('a'), makeItem('b')], { a: 1, b: 2 });

      expect(selectTopStories(twoItems, NO_MINIMUM).lead).toBeNull();
      expect(selectTopStories([makeItem('solo', { editorialRank: 1 })], NO_MINIMUM).lead).toBeNull();
      expect(selectTopStories(twoItems, TOP_STORIES_TOTAL).lead).toBeNull();
    });
  });

  it('does not mutate the input array', () => {
    const items = withEditorial([makeItem('a'), makeItem('b'), makeItem('c')], { c: 1, b: 2, a: 3 });
    const order = items.map((i) => i.uid);
    selectTopStories(items, NO_MINIMUM);

    expect(items.map((i) => i.uid)).toEqual(order);
  });
});
