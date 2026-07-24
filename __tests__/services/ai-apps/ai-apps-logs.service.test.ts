import { customFetch } from '@/utils/fetch-wrapper';
import { fetchAiAppLogsPage, AiAppLogsError } from '@/services/ai-apps/ai-apps.service';

jest.mock('@/utils/fetch-wrapper', () => ({
  customFetch: jest.fn(),
}));

const mockCustomFetch = customFetch as jest.MockedFunction<typeof customFetch>;

const jsonResponse = (status: number, body: unknown = {}) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  }) as unknown as Response;

const event = (timestamp: number, message = `line at ${timestamp}`) => ({ timestamp, message });

const errorKindOf = async (promise: Promise<unknown>) => {
  try {
    await promise;
    return null;
  } catch (error) {
    return error instanceof AiAppLogsError ? error.errorKind : error;
  }
};

describe('fetchAiAppLogsPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns an end-of-stream page (no nextToken) when the response has none', async () => {
    mockCustomFetch.mockResolvedValue(jsonResponse(200, { events: [event(1), event(2)] }));

    await expect(fetchAiAppLogsPage('a1', 'build')).resolves.toEqual({
      events: [event(2), event(1)],
      nextToken: undefined,
    });
    expect(mockCustomFetch).toHaveBeenCalledTimes(1);
  });

  it('surfaces a fresh nextToken so the next scroll-step can resume', async () => {
    mockCustomFetch.mockResolvedValue(jsonResponse(200, { events: [event(1)], nextToken: 'more' }));

    const page = await fetchAiAppLogsPage('a1', 'runtime');
    expect(page.nextToken).toBe('more');
    // One non-empty page per step — never chained inside the fetcher.
    expect(mockCustomFetch).toHaveBeenCalledTimes(1);
  });

  it('resumes from the caller-provided nextToken', async () => {
    mockCustomFetch.mockResolvedValue(jsonResponse(200, { events: [event(9)] }));

    await fetchAiAppLogsPage('a1', 'build', { nextToken: 'cursor-1' });
    expect(mockCustomFetch.mock.calls[0][0]).toContain('nextToken=cursor-1');
  });

  it('sorts events newest-first by timestamp regardless of server order', async () => {
    mockCustomFetch.mockResolvedValue(jsonResponse(200, { events: [event(30), event(10), event(20)] }));

    const page = await fetchAiAppLogsPage('a1', 'runtime');
    expect(page.events.map((e) => e.timestamp)).toEqual([30, 20, 10]);
  });

  it('treats a repeated nextToken on an empty page as end-of-stream (CloudWatch never nulls it)', async () => {
    mockCustomFetch
      .mockResolvedValueOnce(jsonResponse(200, { events: [], nextToken: 'tok' }))
      .mockResolvedValueOnce(jsonResponse(200, { events: [], nextToken: 'tok' }));

    await expect(fetchAiAppLogsPage('a1', 'build')).resolves.toEqual({ events: [] });
    expect(mockCustomFetch).toHaveBeenCalledTimes(2);
    expect(mockCustomFetch.mock.calls[1][0]).toContain('nextToken=tok');
  });

  it('does not report a nextToken when a non-empty page echoes the token it was sent', async () => {
    mockCustomFetch.mockResolvedValue(jsonResponse(200, { events: [event(1)], nextToken: 'cursor-1' }));

    const page = await fetchAiAppLogsPage('a1', 'build', { nextToken: 'cursor-1' });
    expect(page.nextToken).toBeUndefined();
  });

  it('skips empty pages within a step and returns the first non-empty one', async () => {
    mockCustomFetch
      .mockResolvedValueOnce(jsonResponse(200, { events: [], nextToken: 't1' }))
      .mockResolvedValueOnce(jsonResponse(200, { events: [event(5)] }));

    await expect(fetchAiAppLogsPage('a1', 'build')).resolves.toEqual({ events: [event(5)], nextToken: undefined });
  });

  it('yields an empty page WITH the last token when the skip budget runs out — the cursor survives', async () => {
    // Exactly the skip budget: clearAllMocks doesn't drop unconsumed
    // mockResolvedValueOnce queues, so extras would leak into later tests.
    for (let i = 0; i < 5; i++) {
      mockCustomFetch.mockResolvedValueOnce(jsonResponse(200, { events: [], nextToken: `t${i}` }));
    }

    const page = await fetchAiAppLogsPage('a1', 'runtime');
    expect(page.events).toEqual([]);
    expect(page.nextToken).toBe('t4');
    expect(mockCustomFetch).toHaveBeenCalledTimes(5);
  });

  it('yields an empty page WITH the last token when the wall-clock budget is exhausted', async () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValueOnce(0).mockReturnValue(60_000);
    mockCustomFetch.mockResolvedValue(jsonResponse(200, { events: [], nextToken: 'fresh' }));

    const page = await fetchAiAppLogsPage('a1', 'runtime');
    expect(page).toEqual({ events: [], nextToken: 'fresh' });
    nowSpy.mockRestore();
  });

  it.each([
    [403, 'forbidden'],
    [404, 'not-found'],
    [502, 'network'],
  ] as const)('throws AiAppLogsError(%s → %s)', async (status, errorKind) => {
    mockCustomFetch.mockResolvedValue(jsonResponse(status));
    await expect(errorKindOf(fetchAiAppLogsPage('a1', 'build'))).resolves.toBe(errorKind);
  });

  it('maps a missing response (logout/refresh path) to a network AiAppLogsError', async () => {
    mockCustomFetch.mockResolvedValue(undefined as unknown as Response);
    await expect(errorKindOf(fetchAiAppLogsPage('a1', 'build'))).resolves.toBe('network');
  });

  it('rethrows AbortError as-is — a cancelled fetch must not resolve or be re-wrapped', async () => {
    const abort = new DOMException('The operation was aborted.', 'AbortError');
    mockCustomFetch.mockRejectedValue(abort);

    await expect(fetchAiAppLogsPage('a1', 'runtime')).rejects.toBe(abort);
  });

  it('maps a non-abort rejection to a network AiAppLogsError', async () => {
    mockCustomFetch.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(errorKindOf(fetchAiAppLogsPage('a1', 'build'))).resolves.toBe('network');
  });

  it('treats a non-JSON body as an empty end-of-stream page, not a crash', async () => {
    mockCustomFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.reject(new Error('bad json')),
    } as unknown as Response);

    await expect(fetchAiAppLogsPage('a1', 'build')).resolves.toEqual({ events: [] });
  });

  it('drops malformed entries without a string message', async () => {
    mockCustomFetch.mockResolvedValue(
      jsonResponse(200, { events: [event(1), { timestamp: 2 }, null, 'junk', event(3)] }),
    );

    const page = await fetchAiAppLogsPage('a1', 'build');
    expect(page.events).toEqual([event(3), event(1)]);
  });

  it('sends limit always, sinceMinutes only when provided, and passes the signal through', async () => {
    mockCustomFetch.mockResolvedValue(jsonResponse(200, { events: [event(1)] }));
    const controller = new AbortController();

    await fetchAiAppLogsPage('a1', 'runtime', { signal: controller.signal, sinceMinutes: 1440 });
    const [url, init] = mockCustomFetch.mock.calls[0];
    expect(url).toContain('/a1/runtime-logs?');
    expect(url).toContain('limit=');
    expect(url).toContain('sinceMinutes=1440');
    expect((init as RequestInit).signal).toBe(controller.signal);

    mockCustomFetch.mockClear();
    mockCustomFetch.mockResolvedValue(jsonResponse(200, { events: [event(1)] }));
    await fetchAiAppLogsPage('a1', 'build');
    expect(mockCustomFetch.mock.calls[0][0]).not.toContain('sinceMinutes');
  });

  it('URL-encodes tokens with reserved characters', async () => {
    mockCustomFetch.mockResolvedValue(jsonResponse(200, { events: [event(1)] }));

    await fetchAiAppLogsPage('a1', 'build', { nextToken: 'a/b+c' });
    expect(mockCustomFetch.mock.calls[0][0]).toContain('nextToken=a%2Fb%2Bc');
  });
});
