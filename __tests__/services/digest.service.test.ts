import {
  exchangeDigestLink,
  getDigestEmailSettings,
  getDigestIssuePage,
  saveDigestEmailSettings,
  saveDigestIssueChoice,
} from '@/services/digest/digest.service';

const customFetch = jest.fn();
jest.mock('@/utils/fetch-wrapper', () => ({ customFetch: (...args: unknown[]) => customFetch(...args) }));

/** LAB-3264: the digest page API client; LAB-3351: by issue id, with sign-in for choices. */
describe('digest.service', () => {
  const realFetch = global.fetch;
  const respond = (status: number, body?: unknown) =>
    (global.fetch = jest.fn(async () => ({ ok: status < 400, status, json: async () => body }) as Response) as any);
  const down = () =>
    (global.fetch = jest.fn(async () => {
      throw new Error('down');
    }) as any);

  beforeEach(() => {
    process.env.DIRECTORY_API_URL = 'https://api';
    customFetch.mockReset();
  });
  afterEach(() => (global.fetch = realFetch));

  describe('exchangeDigestLink', () => {
    it('posts the token, uncached, and returns the issue id', async () => {
      respond(200, { issueUid: 'iss-1' });
      await expect(exchangeDigestLink('tok')).resolves.toEqual({ issueUid: 'iss-1' });
      expect(global.fetch).toHaveBeenCalledWith('https://api/v1/labos-digest/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'tok' }),
        cache: 'no-store',
      });
    });

    it('sends the send time of an older Past issues link', async () => {
      respond(200, { issueUid: 'iss-0' });
      await exchangeDigestLink('tok', '2026-11-12T09:00:00.000Z');
      expect((global.fetch as jest.Mock).mock.calls[0][1].body).toBe(
        JSON.stringify({ token: 'tok', issue: '2026-11-12T09:00:00.000Z' }),
      );
    });

    it.each([
      [401, { reason: 'expired' }, 'expired'],
      [401, { reason: 'signature' }, 'invalid'],
      [400, {}, 'invalid'],
      [404, {}, 'invalid'],
      [503, {}, 'unavailable'],
      [200, {}, 'unavailable'],
    ])('maps %s %j to %s', async (status, body, error) => {
      respond(status, body);
      await expect(exchangeDigestLink('tok')).resolves.toEqual({ error });
    });

    it('is unavailable when the API does not answer', async () => {
      down();
      await expect(exchangeDigestLink('tok')).resolves.toEqual({ error: 'unavailable' });
    });
  });

  describe('getDigestIssuePage', () => {
    it('reads the issue uncached, with no session signed out, and fills the page v2 fields', async () => {
      respond(200, { frequency: 'daily', stories: [] });
      await expect(getDigestIssuePage('iss-1')).resolves.toEqual({
        data: {
          frequency: 'daily',
          stories: [],
          isTeamMember: false,
          nextSendAt: null,
          topics: { followed: [], suggested: [] },
          issues: [],
          networkNews: [],
          events: { items: [], total: 0 },
        },
      });
      expect(global.fetch).toHaveBeenCalledWith('https://api/v1/labos-digest/issue-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueUid: 'iss-1' }),
        cache: 'no-store',
      });
    });

    it('sends the reader’s session when there is one', async () => {
      respond(200, { frequency: 'daily', stories: [] });
      await getDigestIssuePage('iss-1', 'jwt');
      expect((global.fetch as jest.Mock).mock.calls[0][1].headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer jwt',
      });
    });

    it('fills a story’s v2 fields when the backend does not send them yet (LAB-3287)', async () => {
      respond(200, {
        frequency: 'weekly',
        stories: [{ uid: 'a', sourceUrl: 'https://news.example/a', sourceDomain: 'news.example' }],
      });
      const result = await getDigestIssuePage('iss-1');
      expect(result.data?.stories[0]).toMatchObject({
        teamLogoUrl: null,
        followsTeam: false,
        commentCount: 0,
        sources: [{ url: 'https://news.example/a', domain: 'news.example' }],
      });
    });

    it.each([
      [404, 'invalid'],
      [400, 'invalid'],
      [401, 'unavailable'],
      [500, 'unavailable'],
    ])('maps %s to %s', async (status, error) => {
      respond(status, {});
      await expect(getDigestIssuePage('iss-1')).resolves.toEqual({ error });
    });

    it('is unavailable when the API does not answer', async () => {
      down();
      await expect(getDigestIssuePage('iss-1')).resolves.toEqual({ error: 'unavailable' });
    });
  });

  describe('saveDigestIssueChoice', () => {
    it('saves with the session through customFetch, and never a token', async () => {
      customFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ newsItemUid: 'n1', choice: 'less', changed: true }),
      });
      await expect(saveDigestIssueChoice('iss-1', 'n1', 'less')).resolves.toEqual({
        newsItemUid: 'n1',
        choice: 'less',
        changed: true,
      });
      expect(customFetch).toHaveBeenCalledWith(
        'https://api/v1/labos-digest/issue-choices',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ issueUid: 'iss-1', newsItemUid: 'n1', choice: 'less' }),
        },
        true,
      );
    });

    it('throws on a failed save, and when there is no session to send', async () => {
      customFetch.mockResolvedValueOnce({ ok: false, status: 401 });
      await expect(saveDigestIssueChoice('iss-1', 'n1', 'none')).rejects.toThrow('401');
      customFetch.mockResolvedValueOnce(undefined);
      await expect(saveDigestIssueChoice('iss-1', 'n1', 'more')).rejects.toThrow();
    });
  });

  describe('digest email settings (LAB-3312)', () => {
    it('reads on the server with the token in the body, uncached', async () => {
      respond(200, { firstName: 'Ada', enabled: true, frequency: 'weekly' });
      await expect(getDigestEmailSettings('tok')).resolves.toEqual({
        data: { firstName: 'Ada', enabled: true, frequency: 'weekly' },
      });
      expect(global.fetch).toHaveBeenCalledWith('https://api/v1/labos-digest/email-settings/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'tok' }),
        cache: 'no-store',
      });
    });

    it.each([
      [401, { reason: 'expired' }, 'expired'],
      [401, { reason: 'signature' }, 'invalid'],
      [404, {}, 'invalid'],
      [503, {}, 'unavailable'],
    ])('maps %s %j to %s', async (status, body, error) => {
      respond(status, body);
      await expect(getDigestEmailSettings('tok')).resolves.toEqual({ error });
    });

    it('is invalid without a token and unavailable when the API does not answer', async () => {
      respond(200, {});
      await expect(getDigestEmailSettings(undefined)).resolves.toEqual({ error: 'invalid' });
      expect(global.fetch).not.toHaveBeenCalled();
      global.fetch = jest.fn(async () => {
        throw new Error('down');
      }) as any;
      await expect(getDigestEmailSettings('tok')).resolves.toEqual({ error: 'unavailable' });
    });

    it('saves only the given change and throws on a failed save', async () => {
      respond(200, { firstName: 'Ada', enabled: false, frequency: 'daily' });
      await expect(saveDigestEmailSettings('tok', { enabled: false })).resolves.toEqual({
        firstName: 'Ada',
        enabled: false,
        frequency: 'daily',
      });
      expect(global.fetch).toHaveBeenCalledWith('https://api/v1/labos-digest/email-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'tok', enabled: false }),
      });
      respond(500);
      await expect(saveDigestEmailSettings('tok', { frequency: 'weekly' })).rejects.toThrow();
    });
  });
});
