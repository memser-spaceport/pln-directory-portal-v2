import { gantryTrendingScore, sortGantryItemsByTrending } from '@/services/gantry/constants';
import type { GantryItem } from '@/services/gantry/types';

const baseItem = (overrides: Partial<GantryItem>): GantryItem => ({
  uid: 'item',
  title: 'Need',
  description: '',
  acceptanceCriteria: null,
  stage: 'IDEA',
  focusArea: null,
  objective: null,
  tags: null,
  type: null,
  order: null,
  createdByUid: 'member-1',
  createdBy: { uid: 'member-1', name: 'Alice', imageUrl: null },
  promotedAt: null,
  promotedByUid: null,
  declinedReason: null,
  externalTrackerUrl: null,
  upvoteCount: 0,
  viewerHasUpvoted: false,
  pinCount: 0,
  viewerHasPinned: false,
  viewerPinNote: null,
  deletedAt: null,
  createdAt: '2026-06-01T12:00:00.000Z',
  updatedAt: '2026-06-01T12:00:00.000Z',
  ...overrides,
});

describe('gantry trending sort', () => {
  const now = new Date('2026-06-11T12:00:00.000Z').getTime();

  it('tie-breaks zero-boost items by recency', () => {
    const items = [
      baseItem({ uid: 'older', pinCount: 0, createdAt: '2026-06-01T12:00:00.000Z' }),
      baseItem({ uid: 'newer', pinCount: 0, createdAt: '2026-06-10T12:00:00.000Z' }),
    ];

    expect(sortGantryItemsByTrending(items).map((item) => item.uid)).toEqual(['newer', 'older']);
  });

  it('ranks a few-days-old high-boost item above a fresh low-boost item', () => {
    const fresh = baseItem({ uid: 'fresh', pinCount: 2, createdAt: '2026-06-11T10:00:00.000Z' });
    const established = baseItem({ uid: 'established', pinCount: 10, createdAt: '2026-06-08T12:00:00.000Z' });

    expect(gantryTrendingScore(established, now)).toBeGreaterThan(gantryTrendingScore(fresh, now));
    expect(sortGantryItemsByTrending([fresh, established]).map((item) => item.uid)).toEqual([
      'established',
      'fresh',
    ]);
  });

  it('boosts recent high-signal items ahead of stale high-count items', () => {
    const recentBoosted = baseItem({
      uid: 'recent',
      pinCount: 3,
      createdAt: '2026-06-09T12:00:00.000Z',
    });
    const staleBoosted = baseItem({
      uid: 'stale',
      pinCount: 4,
      createdAt: '2026-01-01T12:00:00.000Z',
    });

    expect(gantryTrendingScore(recentBoosted, now)).toBeGreaterThan(gantryTrendingScore(staleBoosted, now));
    expect(sortGantryItemsByTrending([staleBoosted, recentBoosted]).map((item) => item.uid)).toEqual([
      'recent',
      'stale',
    ]);
  });
});
