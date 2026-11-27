import { endSession, establishSession, refreshSession } from '@/services/session.service';

const fetchMock = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (global as any).fetch = fetchMock;
});

describe('browser session helpers', () => {
  it('refreshSession: concurrent callers share one request', async () => {
    let resolve!: (value: unknown) => void;
    fetchMock.mockReturnValue(new Promise((r) => (resolve = r)));

    const first = refreshSession();
    const second = refreshSession();
    resolve({ ok: true, json: async () => ({ accessToken: 'a2', userInfo: { uid: 'm-1' } }) });

    expect(await first).toEqual({ status: 'ok', session: { accessToken: 'a2', userInfo: { uid: 'm-1' } } });
    expect(await second).toEqual({ status: 'ok', session: { accessToken: 'a2', userInfo: { uid: 'm-1' } } });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/refresh', expect.objectContaining({ method: 'POST' }));
  });

  it('refreshSession: a later call after the first settles makes a new request', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ accessToken: 'a', userInfo: { uid: 'm-1' } }) });

    await refreshSession();
    await refreshSession();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('refreshSession: resolves expired only on 401', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401 });
    expect(await refreshSession()).toEqual({ status: 'expired' });
  });

  it.each<[string, () => void]>([
    ['a 503', () => void fetchMock.mockResolvedValue({ ok: false, status: 503 })],
    ['a network error', () => void fetchMock.mockRejectedValue(new Error('offline'))],
    [
      'a body without userInfo',
      () => void fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ accessToken: 'a' }) }),
    ],
    [
      'a body that is not JSON',
      () =>
        void fetchMock.mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => {
            throw new Error('not json');
          },
        }),
    ],
  ])('refreshSession: resolves unavailable on %s', async (_label, arrange) => {
    arrange();
    expect(await refreshSession()).toEqual({ status: 'unavailable' });
  });

  it('establishSession: posts the tokens as JSON and reports the result', async () => {
    fetchMock.mockResolvedValue({ ok: true });
    const tokens = { accessToken: 'a', refreshToken: 'r', userInfo: { uid: 'm-1' } };

    expect(await establishSession(tokens)).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/session',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tokens),
      }),
    );

    fetchMock.mockResolvedValue({ ok: false });
    expect(await establishSession(tokens)).toBe(false);
    fetchMock.mockRejectedValue(new Error('offline'));
    expect(await establishSession(tokens)).toBe(false);
  });

  it('endSession: calls the logout route and never throws', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    await expect(endSession()).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({ method: 'POST' }));
  });
});
