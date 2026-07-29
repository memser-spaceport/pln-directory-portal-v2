import {
  createFeedComment,
  deleteFeedComment,
  getFeedCommentCounts,
  getFeedComments,
  getFeedForumPosts,
  toggleFeedForumPostLike,
} from '@/services/feed/feed.service';
import { customFetch } from '@/utils/fetch-wrapper';

jest.mock('@/utils/fetch-wrapper', () => ({ customFetch: jest.fn() }));

const customFetchMock = customFetch as jest.Mock;
const VIEWER = { memberUid: 'viewer-1', name: 'Test Viewer', avatarUrl: null, role: null };

const originalApiUrl = process.env.DIRECTORY_API_URL;
const originalForumApiUrl = process.env.FORUM_API_URL;
const originalForumToken = process.env.CUSTOM_FORUM_AUTH_TOKEN;

const TOPIC = {
  tid: 96,
  cid: 5,
  mainPid: 263,
  titleRaw: 'Willow Is Live!',
  title: 'Willow Is Live!',
  teaser: { content: '<p>Hi Protocol Labs</p>' },
  category: { name: 'Intros' },
  timestamp: 1782891482999,
  postcount: 3,
  upvotes: 5,
  user: {
    memberUid: 'cmo6tw96g005kq04h7yu2rkar',
    displayname: 'Matt Curran',
    username: 'matt-curran',
    picture: null,
    teamRole: 'Marketing & Business Development',
  },
};

afterAll(() => {
  process.env.DIRECTORY_API_URL = originalApiUrl;
  process.env.FORUM_API_URL = originalForumApiUrl;
  process.env.CUSTOM_FORUM_AUTH_TOKEN = originalForumToken;
});

describe('feed.service (real API)', () => {
  const fetchMock = jest.fn();

  beforeAll(() => {
    process.env.DIRECTORY_API_URL = 'https://api.example.com';
    process.env.FORUM_API_URL = 'https://forum.example.com';
    process.env.CUSTOM_FORUM_AUTH_TOKEN = 'forum-token';
    global.fetch = fetchMock;
  });

  beforeEach(() => {
    fetchMock.mockReset();
    customFetchMock.mockReset();
  });

  it('getFeedForumPosts requests NodeBB /api/recent directly', async () => {
    customFetchMock.mockResolvedValue({ ok: true, json: async () => ({ topics: [] }) });
    await getFeedForumPosts();
    expect(customFetchMock).toHaveBeenCalledWith(
      'https://forum.example.com/api/recent',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer forum-token' }) }),
      false,
    );
  });

  it('getFeedForumPosts maps NodeBB topics to the feed shape (real reply/vote counts, HTML stripped)', async () => {
    customFetchMock.mockResolvedValue({ ok: true, json: async () => ({ topics: [TOPIC] }) });
    const { items } = await getFeedForumPosts();
    expect(items).toEqual([
      expect.objectContaining({
        uid: 'fp_96',
        title: 'Willow Is Live!',
        body: 'Hi Protocol Labs',
        category: 'Intros',
        commentCount: 2,
        likeCount: 5,
        viewerHasLiked: false,
        forumTopicUrl: '/forum/topics/5/96',
      }),
    ]);
  });

  it('getFeedForumPosts returns an empty list when NodeBB is unreachable', async () => {
    customFetchMock.mockResolvedValue({ ok: false, status: 500 });
    await expect(getFeedForumPosts()).rejects.toThrow('Failed to fetch feed forum posts');
  });

  it('toggleFeedForumPostLike votes on the cached topic main post directly on NodeBB', async () => {
    customFetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ topics: [TOPIC] }) });
    await getFeedForumPosts();
    customFetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    const status = await toggleFeedForumPostLike('fp_96', true);

    expect(customFetchMock).toHaveBeenLastCalledWith(
      'https://forum.example.com/api/v3/posts/263/vote',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ delta: 1 }) }),
      false,
    );
    expect(status).toEqual({ likeCount: 6, viewerHasLiked: true });
  });

  it('toggleFeedForumPostLike throws for a uid it never fetched (no cached NodeBB post id)', async () => {
    await expect(toggleFeedForumPostLike('fp_unknown', true)).rejects.toThrow(
      'Failed to toggle feed forum post like',
    );
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
