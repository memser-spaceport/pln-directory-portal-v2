import { customFetch } from '@/utils/fetch-wrapper';
import { fetchAiAppLogs } from '@/services/ai-apps/ai-apps.service';

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

describe('fetchAiAppLogs', () => {
  beforeEach(() => jest.clearAllMocks());

  it('resolves complete on a single non-empty page without a nextToken', async () => {
    mockCustomFetch.mockResolvedValue(jsonResponse(200, { events: [event(1), event(2)] }));

    await expect(fetchAiAppLogs('a1', 'build')).resolves.toEqual({
      events: [event(1), event(2)],
      termination: { reason: 'complete' },
    });
    expect(mockCustomFetch).toHaveBeenCalledTimes(1);
  });

  it('marks truncated when a non-empty page comes with a fresh nextToken (more log remains)', async () => {
    mockCustomFetch.mockResolvedValue(jsonResponse(200, { events: [event(1)], nextToken: 'more' }));

    const result = await fetchAiAppLogs('a1', 'runtime');
    expect(result.termination).toEqual({ reason: 'truncated' });
    // v1 never chains past the first non-empty page.
    expect(mockCustomFetch).toHaveBeenCalledTimes(1);
  });

  it('sorts events ascending by timestamp regardless of server order', async () => {
    mockCustomFetch.mockResolvedValue(jsonResponse(200, { events: [event(30), event(10), event(20)] }));

    const result = await fetchAiAppLogs('a1', 'runtime');
    expect(result.events.map((e) => e.timestamp)).toEqual([10, 20, 30]);
  });

  it('treats a repeated nextToken on an empty page as end-of-stream (CloudWatch never nulls it)', async () => {
    mockCustomFetch
      .mockResolvedValueOnce(jsonResponse(200, { events: [], nextToken: 'tok' }))
      .mockResolvedValueOnce(jsonResponse(200, { events: [], nextToken: 'tok' }));

    await expect(fetchAiAppLogs('a1', 'build')).resolves.toEqual({
      events: [],
      termination: { reason: 'complete' },
    });
    expect(mockCustomFetch).toHaveBeenCalledTimes(2);
    // The second request carried the token from the first.
    expect(mockCustomFetch.mock.calls[1][0]).toContain(`nextToken=tok`);
  });

  it('skips empty pages and returns the first non-empty one', async () => {
    mockCustomFetch
      .mockResolvedValueOnce(jsonResponse(200, { events: [], nextToken: 't1' }))
      .mockResolvedValueOnce(jsonResponse(200, { events: [event(5)] }));

    await expect(fetchAiAppLogs('a1', 'build')).resolves.toEqual({
      events: [event(5)],
      termination: { reason: 'complete' },
    });
  });

  it('gives up as truncated after the page budget while empty pages keep advancing the token', async () => {
    for (let i = 0; i < 10; i++) {
      mockCustomFetch.mockResolvedValueOnce(jsonResponse(200, { events: [], nextToken: `t${i}` }));
    }

    const result = await fetchAiAppLogs('a1', 'runtime');
    expect(result).toEqual({ events: [], termination: { reason: 'truncated' } });
    expect(mockCustomFetch).toHaveBeenCalledTimes(5);
  });

  it('gives up as truncated when the wall-clock budget is exhausted', async () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValueOnce(0).mockReturnValue(60_000);
    mockCustomFetch.mockResolvedValue(jsonResponse(200, { events: [], nextToken: 'fresh' }));

    const result = await fetchAiAppLogs('a1', 'runtime');
    expect(result.termination).toEqual({ reason: 'truncated' });
    nowSpy.mockRestore();
  });

  it.each([
    [403, 'forbidden'],
    [404, 'not-found'],
    [502, 'network'],
  ] as const)('discriminates a %s response as failed/%s', async (status, errorKind) => {
    mockCustomFetch.mockResolvedValue(jsonResponse(status));

    await expect(fetchAiAppLogs('a1', 'build')).resolves.toEqual({
      events: [],
      termination: { reason: 'failed', errorKind },
    });
  });

  it('maps a missing response (logout/refresh path) to failed/network', async () => {
    mockCustomFetch.mockResolvedValue(undefined as unknown as Response);

    await expect(fetchAiAppLogs('a1', 'build')).resolves.toEqual({
      events: [],
      termination: { reason: 'failed', errorKind: 'network' },
    });
  });

  it('rethrows AbortError instead of resolving — a cancelled fetch must not cache a snapshot', async () => {
    const abort = new DOMException('The operation was aborted.', 'AbortError');
    mockCustomFetch.mockRejectedValue(abort);

    await expect(fetchAiAppLogs('a1', 'runtime')).rejects.toBe(abort);
  });

  it('maps a non-abort rejection to failed/network', async () => {
    mockCustomFetch.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(fetchAiAppLogs('a1', 'build')).resolves.toEqual({
      events: [],
      termination: { reason: 'failed', errorKind: 'network' },
    });
  });

  it('treats a non-JSON body as an empty stream, not a crash', async () => {
    mockCustomFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.reject(new Error('bad json')),
    } as unknown as Response);

    await expect(fetchAiAppLogs('a1', 'build')).resolves.toEqual({
      events: [],
      termination: { reason: 'complete' },
    });
  });

  it('drops malformed entries without a string message', async () => {
    mockCustomFetch.mockResolvedValue(
      jsonResponse(200, { events: [event(1), { timestamp: 2 }, null, 'junk', event(3)] }),
    );

    const result = await fetchAiAppLogs('a1', 'build');
    expect(result.events).toEqual([event(1), event(3)]);
  });

  it('sends limit always, sinceMinutes only when provided, and passes the signal through', async () => {
    mockCustomFetch.mockResolvedValue(jsonResponse(200, { events: [event(1)] }));
    const controller = new AbortController();

    await fetchAiAppLogs('a1', 'runtime', { signal: controller.signal, sinceMinutes: 1440 });
    const [url, init] = mockCustomFetch.mock.calls[0];
    expect(url).toContain('/a1/logs/runtime?');
    expect(url).toContain('limit=2000');
    expect(url).toContain('sinceMinutes=1440');
    expect((init as RequestInit).signal).toBe(controller.signal);

    mockCustomFetch.mockClear();
    mockCustomFetch.mockResolvedValue(jsonResponse(200, { events: [event(1)] }));
    await fetchAiAppLogs('a1', 'build');
    expect(mockCustomFetch.mock.calls[0][0]).not.toContain('sinceMinutes');
  });

  it('URL-encodes tokens with reserved characters', async () => {
    mockCustomFetch
      .mockResolvedValueOnce(jsonResponse(200, { events: [], nextToken: 'a/b+c' }))
      .mockResolvedValueOnce(jsonResponse(200, { events: [event(1)] }));

    await fetchAiAppLogs('a1', 'build');
    expect(mockCustomFetch.mock.calls[1][0]).toContain('nextToken=a%2Fb%2Bc');
  });
});
