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

/** A comment as the directory backend sends it (BE PR #3293). */
const WIRE_AUTHOR = { uid: 'member-1', name: 'Test Viewer', avatarUrl: null };

function wireComment(overrides: Record<string, unknown> = {}) {
  return {
    uid: 'c-1',
    newsItemUid: 'n-1',
    parentUid: null,
    text: 'Hi',
    author: WIRE_AUTHOR,
    createdAt: 'now',
    isOwn: true,
    replies: [],
    ...overrides,
  };
}

/** A NodeBB topic as /api/recent lists it. */
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

const originalApiUrl = process.env.DIRECTORY_API_URL;
const originalForumApiUrl = process.env.FORUM_API_URL;
const originalForumToken = process.env.CUSTOM_FORUM_AUTH_TOKEN;

afterAll(() => {
  process.env.DIRECTORY_API_URL = originalApiUrl;
  process.env.FORUM_API_URL = originalForumApiUrl;
  process.env.CUSTOM_FORUM_AUTH_TOKEN = originalForumToken;
});

describe('feed.service', () => {
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

  describe('forum posts (NodeBB, no longer proxied by the directory backend)', () => {
    it('reads NodeBB /api/recent directly, with the forum token', async () => {
      customFetchMock.mockResolvedValue({ ok: true, json: async () => ({ topics: [] }) });

      await getFeedForumPosts();

      expect(customFetchMock).toHaveBeenCalledWith(
        'https://forum.example.com/api/recent',
        expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer forum-token' }) }),
        false,
      );
    });

    it('maps a topic onto the feed shape, carrying tid/mainPid so votes and replies need no lookup', async () => {
      customFetchMock.mockResolvedValue({ ok: true, json: async () => ({ topics: [TOPIC] }) });

      const { items } = await getFeedForumPosts();

      expect(items).toEqual([
        expect.objectContaining({
          uid: 'fp_96',
          tid: 96,
          mainPid: 263,
          title: 'Willow Is Live!',
          body: 'Hi Protocol Labs',
          category: 'Intros',
          forumTopicUrl: '/forum/topics/5/96',
          likeCount: 5,
          viewerHasLiked: false,
        }),
      ]);
    });

    it('counts replies as postcount minus the topic’s own opening post', async () => {
      customFetchMock.mockResolvedValue({ ok: true, json: async () => ({ topics: [TOPIC] }) });

      const { items } = await getFeedForumPosts();

      expect(items[0].commentCount).toBe(2);
    });

    it('never reports a negative reply count for a topic with no posts', async () => {
      customFetchMock.mockResolvedValue({ ok: true, json: async () => ({ topics: [{ ...TOPIC, postcount: 0 }] }) });

      const { items } = await getFeedForumPosts();

      expect(items[0].commentCount).toBe(0);
    });

    it('throws on failure (queryFns never return null)', async () => {
      customFetchMock.mockResolvedValue({ ok: false, status: 500 });

      await expect(getFeedForumPosts()).rejects.toThrow('Failed to fetch feed forum posts');
    });

    it('tolerates a response with no topics array', async () => {
      customFetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });

      await expect(getFeedForumPosts()).resolves.toEqual({ items: [] });
    });
  });

  describe('forum post likes (NodeBB votes)', () => {
    it('votes on the topic’s opening post, using the mainPid carried on the post', async () => {
      customFetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });

      const status = await toggleFeedForumPostLike({ mainPid: 263, likeCount: 5 }, true);

      expect(customFetchMock).toHaveBeenCalledWith(
        'https://forum.example.com/api/v3/posts/263/vote',
        expect.objectContaining({ method: 'PUT', body: JSON.stringify({ delta: 1 }) }),
        false,
      );
      expect(status).toEqual({ likeCount: 6, viewerHasLiked: true });
    });

    it('removes the vote with DELETE and no body', async () => {
      customFetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });

      const status = await toggleFeedForumPostLike({ mainPid: 263, likeCount: 5 }, false);

      expect(customFetchMock).toHaveBeenCalledWith(
        'https://forum.example.com/api/v3/posts/263/vote',
        expect.not.objectContaining({ body: expect.anything() }),
        false,
      );
      expect(status).toEqual({ likeCount: 4, viewerHasLiked: false });
    });

    it('never reports a negative like count when unliking something already at zero', async () => {
      customFetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });

      await expect(toggleFeedForumPostLike({ mainPid: 263, likeCount: 0 }, false)).resolves.toEqual({
        likeCount: 0,
        viewerHasLiked: false,
      });
    });

    it('throws on failure so the caller can roll its overlay back', async () => {
      customFetchMock.mockResolvedValue({ ok: false, status: 403 });

      await expect(toggleFeedForumPostLike({ mainPid: 263, likeCount: 5 }, true)).rejects.toThrow(
        'Failed to toggle feed forum post like',
      );
    });
  });

  describe('comment counts', () => {
    it('POSTs the uid batch and unwraps the {counts} envelope', async () => {
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({ counts: { 'n-1': 2 } }) });

      const counts = await getFeedCommentCounts(['n-1'], 'token-123');

      expect(counts).toEqual({ 'n-1': 2 });
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example.com/v1/feed/comments/counts',
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ uids: ['n-1'] }) }),
      );
      expect(customFetchMock).not.toHaveBeenCalled();
    });

    it('splits a batch larger than the server’s 200-uid cap and merges the results', async () => {
      const uids = Array.from({ length: 250 }, (_, i) => `n-${i}`);
      fetchMock.mockImplementation((_url: string, init: { body: string }) => {
        const { uids: batch } = JSON.parse(init.body) as { uids: string[] };
        return Promise.resolve({
          ok: true,
          json: async () => ({ counts: Object.fromEntries(batch.map((uid) => [uid, 1])) }),
        });
      });

      const counts = await getFeedCommentCounts(uids);

      expect(fetchMock).toHaveBeenCalledTimes(2);
      const sentBatches = fetchMock.mock.calls.map((call) => JSON.parse(call[1].body).uids.length);
      expect(sentBatches).toEqual([200, 50]);
      // Every uid survives the split — one oversized request would have 400ed
      // and taken every count badge on the page with it.
      expect(Object.keys(counts)).toHaveLength(250);
    });

    it('sends exactly one request at the cap boundary', async () => {
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({ counts: {} }) });

      await getFeedCommentCounts(Array.from({ length: 200 }, (_, i) => `n-${i}`));

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('drops forum-post uids — the directory backend only knows news items now', async () => {
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({ counts: { 'n-1': 2 } }) });

      await getFeedCommentCounts(['n-1', 'fp_96']);

      expect(JSON.parse(fetchMock.mock.calls[0][1].body).uids).toEqual(['n-1']);
    });

    it('makes no request at all when nothing is left to ask about', async () => {
      await expect(getFeedCommentCounts(['fp_96'])).resolves.toEqual({});
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('tolerates a response with no counts object', async () => {
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });

      await expect(getFeedCommentCounts(['n-1'])).resolves.toEqual({});
    });
  });

  describe('news comments (directory backend)', () => {
    it('queries by newsItemUid, and also sends the old itemUid so either backend version accepts it', async () => {
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({ items: [] }) });

      await getFeedComments('n-1');

      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe('https://api.example.com/v1/feed/comments?newsItemUid=n-1&itemUid=n-1');
    });

    it('maps the wire shape onto the view model (newsItemUid → itemUid)', async () => {
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({ items: [wireComment()] }) });

      const { items } = await getFeedComments('n-1');

      expect(items[0]).toEqual({
        uid: 'c-1',
        itemUid: 'n-1',
        parentUid: null,
        author: { uid: 'member-1', name: 'Test Viewer', avatarUrl: null },
        text: 'Hi',
        createdAt: 'now',
        isOwn: true,
        replies: [],
      });
    });

    it('maps nested replies at any depth', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [
            wireComment({
              replies: [
                wireComment({
                  uid: 'c-2',
                  parentUid: 'c-1',
                  isOwn: false,
                  replies: [wireComment({ uid: 'c-3', parentUid: 'c-2', isOwn: false })],
                }),
              ],
            }),
          ],
        }),
      });

      const { items } = await getFeedComments('n-1');

      expect(items[0].replies[0].uid).toBe('c-2');
      expect(items[0].replies[0].replies[0].uid).toBe('c-3');
      expect(items[0].replies[0].replies[0].itemUid).toBe('n-1');
    });

    it('keeps a null author name null rather than inventing one', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ items: [wireComment({ author: { uid: 'm-9', name: null, avatarUrl: null } })] }),
      });

      const { items } = await getFeedComments('n-1');

      expect(items[0].author.name).toBeNull();
    });

    it('tolerates a response with no items array', async () => {
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });

      await expect(getFeedComments('n-1')).resolves.toEqual({ items: [] });
    });

    it('throws on failure', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 500 });

      await expect(getFeedComments('n-1')).rejects.toThrow('Failed to fetch feed comments');
    });

    it('createFeedComment sends both field names through the authenticated wrapper', async () => {
      customFetchMock.mockResolvedValue({ ok: true, json: async () => wireComment() });

      const created = await createFeedComment({ itemUid: 'n-1', text: 'Hi' });

      expect(created.uid).toBe('c-1');
      expect(created.itemUid).toBe('n-1');
      expect(customFetchMock).toHaveBeenCalledWith(
        'https://api.example.com/v1/feed/comments',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ newsItemUid: 'n-1', itemUid: 'n-1', text: 'Hi' }),
        }),
        true,
      );
    });

    it('createFeedComment sends parentUid for a reply, and omits it entirely otherwise', async () => {
      customFetchMock.mockResolvedValue({ ok: true, json: async () => wireComment({ uid: 'c-2', parentUid: 'c-1' }) });

      const created = await createFeedComment({ itemUid: 'n-1', parentUid: 'c-1', text: 'Agreed' });

      expect(created.parentUid).toBe('c-1');
      expect(JSON.parse(customFetchMock.mock.calls[0][1].body)).toEqual({
        newsItemUid: 'n-1',
        itemUid: 'n-1',
        parentUid: 'c-1',
        text: 'Agreed',
      });
    });

    it('createFeedComment throws on failure', async () => {
      customFetchMock.mockResolvedValue({ ok: false, status: 400 });

      await expect(createFeedComment({ itemUid: 'n-1', text: 'Hi' })).rejects.toThrow('Failed to post feed comment');
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

      await expect(deleteFeedComment('c-1')).resolves.toEqual({ uid: 'c-1', deleted: true });
    });

    it('deleteFeedComment throws on other failures (e.g. 403 not-author, 401 expired session)', async () => {
      customFetchMock.mockResolvedValue({ ok: false, status: 403 });

      await expect(deleteFeedComment('c-1')).rejects.toThrow('Failed to delete feed comment');
    });
  });

  describe('forum post comments (the real NodeBB thread)', () => {
    const topicResponse = {
      mainPid: 263,
      posts: [
        // posts[0] is the topic's own opening post — the card, not a comment.
        { pid: 263, content: '<p>Hi Protocol Labs</p>', timestamp: 1782891482999, user: {} },
        {
          pid: 264,
          content: '<p>awesome!</p>',
          timestamp: 1782906219045,
          parent: { pid: 263 },
          user: { memberUid: 'm-2', displayname: 'Lacey Wisdom', picture: null, teamRole: 'General Partner' },
        },
        {
          pid: 265,
          content: '<p>thanks!</p>',
          timestamp: 1782906319045,
          parent: { pid: 264 },
          user: { memberUid: 'm-3', displayname: 'Matt Curran', picture: null, teamRole: null },
        },
      ],
    };

    it('reads the topic from NodeBB rather than the directory backend', async () => {
      customFetchMock.mockResolvedValue({ ok: true, json: async () => topicResponse });

      await getFeedComments('fp_96');

      expect(customFetchMock).toHaveBeenCalledWith('https://forum.example.com/api/topic/96', expect.anything(), false);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('nests real replies on parent.pid instead of flattening them', async () => {
      customFetchMock.mockResolvedValue({ ok: true, json: async () => topicResponse });

      const { items } = await getFeedComments('fp_96');

      expect(items).toHaveLength(1);
      expect(items[0].uid).toBe('fpc_264');
      expect(items[0].replies.map((reply) => reply.uid)).toEqual(['fpc_265']);
    });

    it('treats a reply to the opening post as top-level — the opening post is the card, not a comment', async () => {
      customFetchMock.mockResolvedValue({ ok: true, json: async () => topicResponse });

      const { items } = await getFeedComments('fp_96');

      expect(items[0].parentUid).toBeNull();
      expect(items[0].replies[0].parentUid).toBe('fpc_264');
    });

    it('maps a NodeBB post onto the comment view model, HTML intact', async () => {
      customFetchMock.mockResolvedValue({ ok: true, json: async () => topicResponse });

      const { items } = await getFeedComments('fp_96');

      expect(items[0]).toEqual({
        uid: 'fpc_264',
        itemUid: 'fp_96',
        parentUid: null,
        author: { uid: 'm-2', name: 'Lacey Wisdom', avatarUrl: null, role: 'General Partner' },
        // Not stripped: a forum comment's own links and mentions live in this
        // HTML. FeedCommentContent sanitizes it at render.
        text: '<p>awesome!</p>',
        createdAt: new Date(1782906219045).toISOString(),
        isOwn: false,
        // Its own reply, asserted in full by the nesting tests above.
        replies: [expect.objectContaining({ uid: 'fpc_265' })],
      });
    });

    it('never marks a forum comment as the viewer’s own — there is no delete path against NodeBB', async () => {
      customFetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          mainPid: 263,
          posts: [
            { pid: 263, user: {} },
            { pid: 264, content: 'mine', timestamp: 1, selfPost: true, user: { memberUid: 'viewer-1' } },
          ],
        }),
      });

      const { items } = await getFeedComments('fp_96');

      expect(items[0].isOwn).toBe(false);
    });

    it('keeps a reply whose parent is not on this page (a paginated thread) rather than dropping it', async () => {
      customFetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          mainPid: 263,
          posts: [
            { pid: 263, user: {} },
            { pid: 900, content: 'deep reply', timestamp: 1, parent: { pid: 800 }, user: {} },
          ],
        }),
      });

      const { items } = await getFeedComments('fp_96');

      expect(items.map((item) => item.uid)).toEqual(['fpc_900']);
    });

    it('returns an empty thread for a topic with no replies', async () => {
      customFetchMock.mockResolvedValue({ ok: true, json: async () => ({ mainPid: 263, posts: [{ pid: 263 }] }) });

      const { items } = await getFeedComments('fp_96');

      expect(items).toEqual([]);
    });

    it('reports the topic’s own vote state, which the card’s listing never carries', async () => {
      customFetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          mainPid: 263,
          cid: 5,
          postcount: 3,
          posts: [
            { pid: 263, upvotes: 7, upvoted: true },
            { pid: 264, content: 'hi', timestamp: 1, user: {} },
          ],
        }),
      });

      const { forumTopic } = await getFeedComments('fp_96');

      expect(forumTopic?.like).toEqual({ likeCount: 7, viewerHasLiked: true });
      expect(forumTopic?.url).toBe('/forum/topics/5/96');
    });

    it('reports the topic’s real reply count, which can exceed the page it just served', async () => {
      customFetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          mainPid: 263,
          cid: 5,
          // 50 replies exist; NodeBB returned one page of them.
          postcount: 51,
          posts: [{ pid: 263 }, { pid: 264, content: 'hi', timestamp: 1, user: {} }],
        }),
      });

      const { items, forumTopic } = await getFeedComments('fp_96');

      expect(items).toHaveLength(1);
      expect(forumTopic?.totalReplyCount).toBe(50);
    });

    it('treats a missing vote state as not-liked rather than undefined', async () => {
      customFetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ mainPid: 263, cid: 5, postcount: 1, posts: [{ pid: 263 }] }),
      });

      const { forumTopic } = await getFeedComments('fp_96');

      expect(forumTopic?.like).toEqual({ likeCount: 0, viewerHasLiked: false });
    });

    it('passes an attachment-only reply through untouched, for the renderer to label', async () => {
      customFetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          mainPid: 263,
          cid: 5,
          postcount: 2,
          posts: [{ pid: 263 }, { pid: 264, content: '<p><img src="/x.png" /></p>', timestamp: 1, user: {} }],
        }),
      });

      const { items } = await getFeedComments('fp_96');

      // Not dropped, and not pre-judged here. The service no longer decides
      // what's renderable — hasRenderableContent does, after sanitizing, which
      // is the only place that knows the img won't survive the allowlist.
      expect(items).toHaveLength(1);
      expect(items[0].text).toBe('<p><img src="/x.png" /></p>');
    });

    it('throws when the forum is unreachable', async () => {
      customFetchMock.mockResolvedValue({ ok: false, status: 500 });

      await expect(getFeedComments('fp_96')).rejects.toThrow('Failed to fetch feed comments');
    });
  });

  describe('writing a forum post comment (a real NodeBB reply)', () => {
    const created = {
      response: {
        pid: 500,
        content: '<p>Great update!</p>',
        timestamp: 1782906219045,
        user: { memberUid: 'viewer-1', displayname: 'Test Viewer', picture: null, teamRole: null },
      },
    };

    it('replies to the topic’s opening post for a top-level comment, using the pid it was given', async () => {
      customFetchMock.mockResolvedValue({ ok: true, json: async () => created });

      await createFeedComment({ itemUid: 'fp_96', text: 'Great update!', forumMainPid: 263 });

      // One request, not a fetch-the-topic-then-post pair.
      expect(customFetchMock).toHaveBeenCalledTimes(1);
      expect(customFetchMock).toHaveBeenCalledWith(
        'https://forum.example.com/api/v3/topics/96',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ content: '<p>Great update!</p>', toPid: 263 }),
        }),
        false,
      );
    });

    it('replies to a comment’s own post when replying to that comment', async () => {
      customFetchMock.mockResolvedValue({ ok: true, json: async () => created });

      await createFeedComment({ itemUid: 'fp_96', parentUid: 'fpc_264', text: 'Agreed', forumMainPid: 263 });

      expect(JSON.parse(customFetchMock.mock.calls[0][1].body).toPid).toBe(264);
    });

    it('falls back to fetching the topic when no mainPid was supplied', async () => {
      customFetchMock
        .mockResolvedValueOnce({ ok: true, json: async () => ({ mainPid: 263, posts: [] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => created });

      await createFeedComment({ itemUid: 'fp_96', text: 'Great update!' });

      expect(customFetchMock).toHaveBeenNthCalledWith(
        1,
        'https://forum.example.com/api/topic/96',
        expect.anything(),
        false,
      );
      expect(JSON.parse(customFetchMock.mock.calls[1][1].body).toPid).toBe(263);
    });

    it('escapes member text — NodeBB stores content as HTML', async () => {
      customFetchMock.mockResolvedValue({ ok: true, json: async () => created });

      await createFeedComment({ itemUid: 'fp_96', text: '<script>alert(1)</script> & "done"', forumMainPid: 263 });

      expect(JSON.parse(customFetchMock.mock.calls[0][1].body).content).toBe(
        '<p>&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;done&quot;</p>',
      );
    });

    it('returns the created comment carrying the caller’s parentUid, which NodeBB does not always echo', async () => {
      customFetchMock.mockResolvedValue({ ok: true, json: async () => created });

      const comment = await createFeedComment({
        itemUid: 'fp_96',
        parentUid: 'fpc_264',
        text: 'Agreed',
        forumMainPid: 263,
      });

      expect(comment).toEqual(
        expect.objectContaining({
          uid: 'fpc_500',
          itemUid: 'fp_96',
          // Without this the cache patch would land the reply at the root.
          parentUid: 'fpc_264',
          isOwn: false,
          replies: [],
        }),
      );
    });

    it('propagates NodeBB’s rejection message so the composer can explain itself', async () => {
      customFetchMock.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ status: { message: '[[error:content-too-short]]' } }),
      });

      await expect(createFeedComment({ itemUid: 'fp_96', text: 'hi', forumMainPid: 263 })).rejects.toThrow(
        '[[error:content-too-short]]',
      );
    });
  });
});
