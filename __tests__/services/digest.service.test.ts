import { getDigestPage, saveDigestChoice } from '@/services/digest/digest.service';

/** LAB-3264: the digest page API client. */
describe('digest.service', () => {
  const realFetch = global.fetch;
  const respond = (status: number, body?: unknown) =>
    (global.fetch = jest.fn(async () => ({ ok: status < 400, status, json: async () => body }) as Response) as any);

  beforeEach(() => (process.env.DIRECTORY_API_URL = 'https://api'));
  afterEach(() => (global.fetch = realFetch));

  it('posts the token in the body, uncached, and returns the page', async () => {
    respond(200, { frequency: 'daily', stories: [] });
    await expect(getDigestPage('tok')).resolves.toEqual({
      data: {
        frequency: 'daily',
        stories: [],
        isTeamMember: false,
        nextSendAt: null,
        topics: { followed: [], suggested: [] },
        issues: [],
      },
    });
    expect(global.fetch).toHaveBeenCalledWith('https://api/v1/labos-digest/page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'tok' }),
      cache: 'no-store',
    });
  });

  it('fills the page v2 fields when the backend does not send them yet (LAB-3287)', async () => {
    respond(200, {
      frequency: 'weekly',
      stories: [{ uid: 'a', sourceUrl: 'https://news.example/a', sourceDomain: 'news.example' }],
    });
    const result = await getDigestPage('tok');
    expect(result.data?.stories[0]).toMatchObject({
      teamLogoUrl: null,
      followsTeam: false,
      commentCount: 0,
      sources: [{ url: 'https://news.example/a', domain: 'news.example' }],
    });
  });

  it.each([
    [401, { reason: 'expired' }, 'expired'],
    [401, { reason: 'signature' }, 'invalid'],
    [400, {}, 'invalid'],
    [503, {}, 'unavailable'],
    [500, {}, 'unavailable'],
  ])('maps %s %j to %s', async (status, body, error) => {
    respond(status, body);
    await expect(getDigestPage('tok')).resolves.toEqual({ error });
  });

  it('sends a past issue key with the read and with a choice (LAB-3294)', async () => {
    respond(200, { frequency: 'daily', stories: [] });
    await getDigestPage('tok', '2026-11-12T09:00:00.000Z');
    expect((global.fetch as jest.Mock).mock.calls[0][1].body).toBe(
      JSON.stringify({ token: 'tok', issue: '2026-11-12T09:00:00.000Z' }),
    );
    respond(200, { newsItemUid: 'n1', choice: 'more', changed: true });
    await saveDigestChoice('tok', 'n1', 'more', '2026-11-12T09:00:00.000Z');
    expect((global.fetch as jest.Mock).mock.calls[0][1].body).toBe(
      JSON.stringify({ token: 'tok', newsItemUid: 'n1', choice: 'more', issue: '2026-11-12T09:00:00.000Z' }),
    );
  });

  it('is invalid without a token, and calls nothing', async () => {
    respond(200, {});
    await expect(getDigestPage(undefined)).resolves.toEqual({ error: 'invalid' });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('is unavailable when the API does not answer', async () => {
    global.fetch = jest.fn(async () => {
      throw new Error('down');
    }) as any;
    await expect(getDigestPage('tok')).resolves.toEqual({ error: 'unavailable' });
  });

  it('saves a choice and throws on a failed save', async () => {
    respond(200, { newsItemUid: 'n1', choice: 'less', changed: true });
    await expect(saveDigestChoice('tok', 'n1', 'less')).resolves.toEqual({
      newsItemUid: 'n1',
      choice: 'less',
      changed: true,
    });
    expect((global.fetch as jest.Mock).mock.calls[0][1].body).toBe(
      JSON.stringify({ token: 'tok', newsItemUid: 'n1', choice: 'less' }),
    );
    respond(500);
    await expect(saveDigestChoice('tok', 'n1', 'none')).rejects.toThrow();
  });
});
