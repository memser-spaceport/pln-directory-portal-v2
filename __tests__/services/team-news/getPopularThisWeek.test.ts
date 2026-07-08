import { getPopularThisWeek } from '@/services/team-news/utils/getPopularThisWeek';
import type { ITeamNewsItem } from '@/types/team-news.types';

const NOW = new Date('2026-07-08T00:00:00.000Z');

function item(partial: Partial<ITeamNewsItem> & Pick<ITeamNewsItem, 'uid' | 'eventDate'>): ITeamNewsItem {
  return {
    teamUid: 'team-1',
    teamName: 'Team One',
    teamLogoUrl: null,
    eventType: 'ANNOUNCEMENT',
    title: 'Untitled',
    summary: null,
    sourceUrl: 'https://example.com',
    sourceDomain: 'example.com',
    tags: [],
    focusAreas: [],
    subFocusAreas: [],
    createdAt: partial.eventDate,
    discussion: { count: 0, latestTopicUrl: null },
    ...partial,
  };
}

describe('getPopularThisWeek', () => {
  it('returns [] for empty input', () => {
    expect(getPopularThisWeek([], NOW)).toEqual([]);
  });

  it('excludes items outside the 7-day window even with high upvotes', () => {
    const items = [item({ uid: 'old', eventDate: '2026-06-01T00:00:00.000Z', upvoteCount: 50 })];
    expect(getPopularThisWeek(items, NOW)).toEqual([]);
  });

  it('hides the card when the top item has exactly 1 upvote', () => {
    const items = [item({ uid: 'a', eventDate: '2026-07-07T00:00:00.000Z', upvoteCount: 1 })];
    expect(getPopularThisWeek(items, NOW)).toEqual([]);
  });

  it('includes the top item when it has exactly 2 upvotes (threshold boundary)', () => {
    const items = [item({ uid: 'a', eventDate: '2026-07-07T00:00:00.000Z', upvoteCount: 2 })];
    expect(getPopularThisWeek(items, NOW).map((i) => i.uid)).toEqual(['a']);
  });

  it('caps results at 3, highest upvoteCount first', () => {
    const items = [
      item({ uid: 'low', eventDate: '2026-07-07T00:00:00.000Z', upvoteCount: 2 }),
      item({ uid: 'high', eventDate: '2026-07-07T00:00:00.000Z', upvoteCount: 20 }),
      item({ uid: 'mid', eventDate: '2026-07-07T00:00:00.000Z', upvoteCount: 10 }),
      item({ uid: 'mid2', eventDate: '2026-07-07T00:00:00.000Z', upvoteCount: 5 }),
    ];
    const result = getPopularThisWeek(items, NOW);
    expect(result.map((i) => i.uid)).toEqual(['high', 'mid', 'mid2']);
  });

  it('breaks upvoteCount ties by recency', () => {
    const items = [
      item({ uid: 'older', eventDate: '2026-07-05T00:00:00.000Z', upvoteCount: 5 }),
      item({ uid: 'newer', eventDate: '2026-07-07T00:00:00.000Z', upvoteCount: 5 }),
    ];
    const result = getPopularThisWeek(items, NOW);
    expect(result.map((i) => i.uid)).toEqual(['newer', 'older']);
  });

  it('treats a missing upvoteCount as 0', () => {
    const items = [item({ uid: 'a', eventDate: '2026-07-07T00:00:00.000Z' })];
    expect(getPopularThisWeek(items, NOW)).toEqual([]);
  });
});
