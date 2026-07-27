import {
  addMockFeedComment,
  getMockCommentCounts,
  getMockFeedComments,
  getMockForumPosts,
  resetMockFeedStore,
  setMockForumPostsForbidden,
  toggleMockForumPostLike,
} from '@/services/feed/feed.mock-data';
import { MOCK_FEED_FAIL_TOKEN } from '@/services/feed/constants';
import { FeedForumPostsForbiddenError } from '@/services/feed/feed.errors';
import type { IFeedAuthor } from '@/types/feed.types';

const VIEWER: IFeedAuthor = { memberUid: 'viewer-1', name: 'Test Viewer', avatarUrl: null, role: null };

beforeEach(() => {
  resetMockFeedStore();
});

describe('seeded fixtures', () => {
  it('exposes the deliberate boundary cases', async () => {
    const counts = await getMockCommentCounts(['fp_shared-dht', 'fp_compute-pricing', 'mock-pl-net-1', 'unknown']);
    expect(counts['fp_shared-dht']).toBe(0); // "Be the first to comment"
    expect(counts['fp_compute-pricing']).toBe(2); // visible-cap boundary
    expect(counts['mock-pl-net-1']).toBe(6); // "View all N comments"
    expect(counts['unknown']).toBe(0);
  });

  it('derives forum post commentCount from the comment store', async () => {
    const { items } = await getMockForumPosts();
    const pricing = items.find((p) => p.uid === 'fp_compute-pricing');
    expect(pricing?.commentCount).toBe(2);
  });

  it('returns comment threads newest-first', async () => {
    const { items, total } = await getMockFeedComments('mock-pl-net-1');
    expect(total).toBe(6);
    const dates = items.map((c) => c.createdAt);
    expect(dates).toEqual([...dates].sort((a, b) => b.localeCompare(a)));
  });
});

describe('addMockFeedComment', () => {
  it('prepends the new comment and keeps counts consistent', async () => {
    const created = await addMockFeedComment({ itemUid: 'fp_compute-pricing', text: '  A thought  ' }, VIEWER);
    expect(created.text).toBe('A thought');
    expect(created.author).toEqual(VIEWER);

    const { items, total } = await getMockFeedComments('fp_compute-pricing');
    expect(total).toBe(3);
    expect(items[0].uid).toBe(created.uid);

    const counts = await getMockCommentCounts(['fp_compute-pricing']);
    expect(counts['fp_compute-pricing']).toBe(3);

    const { items: posts } = await getMockForumPosts();
    expect(posts.find((p) => p.uid === 'fp_compute-pricing')?.commentCount).toBe(3);
  });

  it('accepts comments for uids with no seed thread', async () => {
    await addMockFeedComment({ itemUid: 'some-real-news-uid', text: 'First!' }, VIEWER);
    const { total } = await getMockFeedComments('some-real-news-uid');
    expect(total).toBe(1);
  });

  it(`rejects comments containing ${MOCK_FEED_FAIL_TOKEN} (the forceable failure)`, async () => {
    await expect(
      addMockFeedComment({ itemUid: 'fp_compute-pricing', text: `boom ${MOCK_FEED_FAIL_TOKEN}` }, VIEWER),
    ).rejects.toThrow();
    const { total } = await getMockFeedComments('fp_compute-pricing');
    expect(total).toBe(2);
  });

  it('rejects whitespace-only comments', async () => {
    await expect(addMockFeedComment({ itemUid: 'fp_compute-pricing', text: '   ' }, VIEWER)).rejects.toThrow();
  });
});

describe('toggleMockForumPostLike', () => {
  it('is idempotent per direction and tracks viewer state', async () => {
    const liked = await toggleMockForumPostLike('fp_compute-pricing', true);
    expect(liked).toEqual({ likeCount: 13, viewerHasLiked: true });

    // Repeating the same direction must not double-count (contract: idempotent).
    expect(await toggleMockForumPostLike('fp_compute-pricing', true)).toEqual({
      likeCount: 13,
      viewerHasLiked: true,
    });

    expect(await toggleMockForumPostLike('fp_compute-pricing', false)).toEqual({
      likeCount: 12,
      viewerHasLiked: false,
    });
  });

  it('throws for unknown posts', async () => {
    await expect(toggleMockForumPostLike('fp_nope', true)).rejects.toThrow('Unknown mock forum post');
  });
});

describe('store isolation', () => {
  it('returns clones — mutating a response never aliases the store', async () => {
    const first = await getMockFeedComments('fp_compute-pricing');
    first.items.pop();
    first.items[0].text = 'tampered';

    const second = await getMockFeedComments('fp_compute-pricing');
    expect(second.total).toBe(2);
    expect(second.items[0].text).not.toBe('tampered');
  });

  it('resetMockFeedStore restores seeds and clears session writes', async () => {
    await addMockFeedComment({ itemUid: 'fp_shared-dht', text: 'Session comment' }, VIEWER);
    await toggleMockForumPostLike('fp_shared-dht', true);
    resetMockFeedStore();

    expect((await getMockFeedComments('fp_shared-dht')).total).toBe(0);
    const { items } = await getMockForumPosts();
    expect(items.find((p) => p.uid === 'fp_shared-dht')?.viewerHasLiked).toBe(false);
  });
});

describe('forbidden simulation (the mock-world 403)', () => {
  it('makes getMockForumPosts throw the typed access error', async () => {
    setMockForumPostsForbidden(true);
    await expect(getMockForumPosts()).rejects.toBeInstanceOf(FeedForumPostsForbiddenError);
  });
});
