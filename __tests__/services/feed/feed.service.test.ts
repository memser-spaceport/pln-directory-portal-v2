import {
  createFeedComment,
  getFeedCommentCounts,
  getFeedComments,
  getFeedForumPosts,
} from '@/services/feed/feed.service';
import { FeedForumPostsForbiddenError } from '@/services/feed/feed.errors';
import { resetMockFeedStore } from '@/services/feed/feed.mock-data';
import { customFetch } from '@/utils/fetch-wrapper';

jest.mock('@/utils/fetch-wrapper', () => ({ customFetch: jest.fn() }));

const customFetchMock = customFetch as jest.Mock;
const VIEWER = { memberUid: 'viewer-1', name: 'Test Viewer', avatarUrl: null, role: null };

const originalApiUrl = process.env.DIRECTORY_API_URL;
const originalMockFlag = process.env.NEXT_PUBLIC_MOCK_FEED_SOCIAL;

afterAll(() => {
  process.env.DIRECTORY_API_URL = originalApiUrl;
  process.env.NEXT_PUBLIC_MOCK_FEED_SOCIAL = originalMockFlag;
});

describe('mock branch (NEXT_PUBLIC_MOCK_FEED_SOCIAL=true)', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_MOCK_FEED_SOCIAL = 'true';
    resetMockFeedStore();
  });

  it('serves fixtures without touching the network', async () => {
    const { items } = await getFeedForumPosts();
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((p) => p.uid.startsWith('fp_'))).toBe(true);
    expect(customFetchMock).not.toHaveBeenCalled();
  });

  it('routes comment writes through the fixture store', async () => {
    const created = await createFeedComment({ itemUid: 'fp_shared-dht', text: 'Hello' }, VIEWER);
    expect(created.itemUid).toBe('fp_shared-dht');
    const counts = await getFeedCommentCounts(['fp_shared-dht']);
    expect(counts['fp_shared-dht']).toBe(1);
    expect(customFetchMock).not.toHaveBeenCalled();
  });
});

describe('real branch (flag off)', () => {
  const fetchMock = jest.fn();

  beforeAll(() => {
    process.env.DIRECTORY_API_URL = 'https://api.example.com';
    global.fetch = fetchMock;
  });

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_MOCK_FEED_SOCIAL;
    fetchMock.mockReset();
    customFetchMock.mockReset();
  });

  it('getFeedForumPosts throws the typed error on 403 (expected news-only state)', async () => {
    customFetchMock.mockResolvedValue({ ok: false, status: 403 });
    await expect(getFeedForumPosts()).rejects.toBeInstanceOf(FeedForumPostsForbiddenError);
  });

  it('getFeedForumPosts throws a plain error on other failures (queryFns never return null)', async () => {
    customFetchMock.mockResolvedValue({ ok: false, status: 500 });
    await expect(getFeedForumPosts()).rejects.toThrow('Failed to fetch feed forum posts');
  });

  it('getFeedCommentCounts POSTs the uid batch (public endpoint, plain fetch)', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ 'n-1': 2 }) });
    const counts = await getFeedCommentCounts(['n-1'], 'token-123');
    expect(counts['n-1']).toBe(2);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/v1/feed/comments/counts',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ uids: ['n-1'] }) }),
    );
    expect(customFetchMock).not.toHaveBeenCalled();
  });

  it('getFeedComments throws on failure', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    await expect(getFeedComments('n-1')).rejects.toThrow('Failed to fetch feed comments');
  });

  it('createFeedComment goes through the authenticated wrapper', async () => {
    customFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ uid: 'c-1', itemUid: 'n-1', author: VIEWER, text: 'Hi', createdAt: 'now' }),
    });
    const created = await createFeedComment({ itemUid: 'n-1', text: 'Hi' }, VIEWER);
    expect(created.uid).toBe('c-1');
    expect(customFetchMock).toHaveBeenCalledWith(
      'https://api.example.com/v1/feed/comments',
      expect.objectContaining({ method: 'POST' }),
      true,
    );
  });
});
