import { ForumWriteError, forumErrorMessage, postForumReply } from '@/services/forum/forum.service';
import { customFetch } from '@/utils/fetch-wrapper';

jest.mock('@/utils/fetch-wrapper', () => ({ customFetch: jest.fn() }));

const customFetchMock = customFetch as jest.Mock;

const FALLBACK = 'Couldn’t post your comment — try again.';

const originalForumApiUrl = process.env.FORUM_API_URL;
const originalForumToken = process.env.CUSTOM_FORUM_AUTH_TOKEN;

afterAll(() => {
  process.env.FORUM_API_URL = originalForumApiUrl;
  process.env.CUSTOM_FORUM_AUTH_TOKEN = originalForumToken;
});

describe('postForumReply', () => {
  beforeAll(() => {
    process.env.FORUM_API_URL = 'https://forum.example.com';
    process.env.CUSTOM_FORUM_AUTH_TOKEN = 'forum-token';
  });

  beforeEach(() => customFetchMock.mockReset());

  it('posts to the topic with the reply target', async () => {
    customFetchMock.mockResolvedValue({ ok: true, json: async () => ({ response: { pid: 500 } }) });

    await postForumReply({ tid: 96, toPid: 263, content: '<p>Hi</p>' });

    expect(customFetchMock).toHaveBeenCalledWith(
      'https://forum.example.com/api/v3/topics/96',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ content: '<p>Hi</p>', toPid: 263 }) }),
      false,
    );
  });

  it('throws with NodeBB’s own message when it supplies one', async () => {
    customFetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ status: { message: '[[error:content-too-short]]' } }),
    });

    await expect(postForumReply({ tid: 96, toPid: 263, content: '<p>x</p>' })).rejects.toThrow(
      '[[error:content-too-short]]',
    );
  });

  it('carries the status when the failure body is unreadable, and invents no message', async () => {
    customFetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('not json');
      },
    });

    await expect(postForumReply({ tid: 96, toPid: 263, content: '<p>x</p>' })).rejects.toMatchObject({
      name: 'ForumWriteError',
      status: 500,
      forumMessage: undefined,
    });
  });

  it('carries a 401 from the auth layer in front of NodeBB, whose body is not NodeBB-shaped', async () => {
    // Observed with an expired CUSTOM_FORUM_AUTH_TOKEN: reads still succeed as a
    // guest, writes come back like this.
    customFetchMock.mockResolvedValue({ ok: false, status: 401, json: async () => ({ error: 'Invalid token' }) });

    await expect(postForumReply({ tid: 96, toPid: 263, content: '<p>x</p>' })).rejects.toMatchObject({
      status: 401,
      forumMessage: 'Invalid token',
    });
  });
});

describe('forumErrorMessage', () => {
  it('explains the minimum post length, which members hit constantly', () => {
    // NodeBB's minimumPostLength defaults to 8 characters, so "nice!" is refused
    // — a generic "try again" leaves no way to work that out.
    expect(forumErrorMessage(new Error('[[error:content-too-short, Content too short]]'), FALLBACK)).toMatch(
      /too short for the forum/,
    );
  });

  it('explains the post rate limit', () => {
    expect(forumErrorMessage(new Error('[[error:too-many-posts, 10]]'), FALLBACK)).toMatch(/posting a little fast/);
  });

  it('explains a missing forum privilege', () => {
    expect(forumErrorMessage(new Error('[[error:no-privileges]]'), FALLBACK)).toMatch(/permission to reply/);
  });

  it('hides any other untranslated key behind the fallback', () => {
    expect(forumErrorMessage(new Error('[[error:some-internal-key]]'), FALLBACK)).toBe(FALLBACK);
  });

  it('passes through a message that is already a sentence', () => {
    expect(forumErrorMessage(new Error('Topic is locked.'), FALLBACK)).toBe('Topic is locked.');
  });

  it('falls back for a non-Error or empty rejection', () => {
    expect(forumErrorMessage(undefined, FALLBACK)).toBe(FALLBACK);
    expect(forumErrorMessage(new Error(''), FALLBACK)).toBe(FALLBACK);
  });

  it('explains a rejected session on 401 — in practice an expired forum token', () => {
    const rejected = new ForumWriteError(401, 'Invalid token');

    expect(forumErrorMessage(rejected, FALLBACK)).toMatch(/didn’t accept your session/);
  });

  it('explains a 403 as a permission problem, not a session one', () => {
    expect(forumErrorMessage(new ForumWriteError(403, undefined), FALLBACK)).toMatch(/permission to reply/);
  });

  it('never leaks our own synthesised wording to a member', () => {
    // No message from the forum ⇒ the Error's text is ours, not theirs.
    expect(forumErrorMessage(new ForumWriteError(500, undefined), FALLBACK)).toBe(FALLBACK);
  });

  it('still prefers the forum’s message when it sent a real one', () => {
    expect(forumErrorMessage(new ForumWriteError(400, 'Topic is locked.'), FALLBACK)).toBe('Topic is locked.');
  });
});
