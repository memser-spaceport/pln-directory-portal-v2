import { forumErrorMessage, postForumReply } from '@/services/forum/forum.service';
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

  it('throws a plain error when the failure body is unreadable', async () => {
    customFetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('not json');
      },
    });

    await expect(postForumReply({ tid: 96, toPid: 263, content: '<p>x</p>' })).rejects.toThrow('Failed to add comment');
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
});
