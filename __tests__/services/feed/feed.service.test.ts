import {
  createFeedComment,
  deleteFeedComment,
  getFeedCommentCounts,
  getFeedComments,
  getFeedForumPosts,
} from '@/services/feed/feed.service';
import { customFetch } from '@/utils/fetch-wrapper';

jest.mock('@/utils/fetch-wrapper', () => ({ customFetch: jest.fn() }));

const customFetchMock = customFetch as jest.Mock;
const VIEWER = { memberUid: 'viewer-1', name: 'Test Viewer', avatarUrl: null, role: null };

const originalApiUrl = process.env.DIRECTORY_API_URL;

afterAll(() => {
  process.env.DIRECTORY_API_URL = originalApiUrl;
});

describe('feed.service (real API)', () => {
  const fetchMock = jest.fn();

  beforeAll(() => {
    process.env.DIRECTORY_API_URL = 'https://api.example.com';
    global.fetch = fetchMock;
  });

  beforeEach(() => {
    fetchMock.mockReset();
    customFetchMock.mockReset();
  });

  it('getFeedForumPosts requests a single bounded page (limit=100, page=0)', async () => {
    customFetchMock.mockResolvedValue({ ok: true, json: async () => ({ items: [] }) });
    await getFeedForumPosts();
    expect(customFetchMock).toHaveBeenCalledWith(
      'https://api.example.com/v1/feed/forum-posts?limit=100&page=0',
      { method: 'GET' },
      true,
    );
  });

  it('getFeedForumPosts returns items on success (no access shows up as an empty list, not an error)', async () => {
    customFetchMock.mockResolvedValue({ ok: true, json: async () => ({ items: [] }) });
    const { items } = await getFeedForumPosts();
    expect(items).toEqual([]);
  });

  it('getFeedForumPosts throws a plain error on failure (queryFns never return null)', async () => {
    customFetchMock.mockResolvedValue({ ok: false, status: 500 });
    await expect(getFeedForumPosts()).rejects.toThrow('Failed to fetch feed forum posts');
  });

  it('getFeedCommentCounts POSTs the uid batch and unwraps the {counts} envelope', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ counts: { 'n-1': 2 } }) });
    const counts = await getFeedCommentCounts(['n-1'], 'token-123');
    expect(counts).toEqual({ 'n-1': 2 });
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

  it('getFeedComments returns the real {items} shape with no total field', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ items: [{ uid: 'c-1', itemUid: 'n-1', author: VIEWER, text: 'Hi', createdAt: 'now', isOwn: true }] }),
    });
    const { items } = await getFeedComments('n-1');
    expect(items).toHaveLength(1);
    expect(items[0].isOwn).toBe(true);
  });

  it('createFeedComment goes through the authenticated wrapper', async () => {
    customFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ uid: 'c-1', itemUid: 'n-1', author: VIEWER, text: 'Hi', createdAt: 'now', isOwn: true }),
    });
    const created = await createFeedComment({ itemUid: 'n-1', text: 'Hi' });
    expect(created.uid).toBe('c-1');
    expect(customFetchMock).toHaveBeenCalledWith(
      'https://api.example.com/v1/feed/comments',
      expect.objectContaining({ method: 'POST' }),
      true,
    );
  });

  it('deleteFeedComment DELETEs through the authenticated wrapper', async () => {
    customFetchMock.mockResolvedValue({ ok: true, json: async () => ({ uid: 'c-1', deleted: true }) });
    const result = await deleteFeedComment('c-1');
    expect(result).toEqual({ uid: 'c-1', deleted: true });
    expect(customFetchMock).toHaveBeenCalledWith(
      'https://api.example.com/v1/feed/comments/c-1',
      { method: 'DELETE' },
      true,
    );
  });

  it('deleteFeedComment treats a 404 (already deleted) as a success no-op', async () => {
    customFetchMock.mockResolvedValue({ ok: false, status: 404 });
    const result = await deleteFeedComment('c-1');
    expect(result).toEqual({ uid: 'c-1', deleted: true });
  });

  it('deleteFeedComment throws on other failures (e.g. 403 not-author, 401 expired session)', async () => {
    customFetchMock.mockResolvedValue({ ok: false, status: 403 });
    await expect(deleteFeedComment('c-1')).rejects.toThrow('Failed to delete feed comment');
  });
});
