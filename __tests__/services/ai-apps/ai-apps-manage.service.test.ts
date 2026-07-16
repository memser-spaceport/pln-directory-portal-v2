import { customFetch } from '@/utils/fetch-wrapper';
import { deleteAiApp, fetchAiApp, hasPrd, updateAiApp } from '@/services/ai-apps/ai-apps.service';

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

describe('fetchAiApp', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the app with no errorKind on success', async () => {
    mockCustomFetch.mockResolvedValue(jsonResponse(200, { uid: 'a1', canManage: true }));
    await expect(fetchAiApp('a1')).resolves.toEqual({ app: { uid: 'a1', canManage: true }, errorKind: null });
  });

  it.each([
    [403, 'forbidden'],
    [404, 'not-found'],
    [500, 'network'],
  ] as const)('discriminates a %s response as %s', async (status, errorKind) => {
    mockCustomFetch.mockResolvedValue(jsonResponse(status));
    await expect(fetchAiApp('a1')).resolves.toEqual({ app: null, errorKind });
  });

  it('treats a missing response (logout/network path) as a network error', async () => {
    mockCustomFetch.mockResolvedValue(undefined as unknown as Response);
    await expect(fetchAiApp('a1')).resolves.toEqual({ app: null, errorKind: 'network' });
  });

  it('URI-encodes the uid', async () => {
    mockCustomFetch.mockResolvedValue(jsonResponse(200, {}));
    await fetchAiApp('a/1?x');
    expect(mockCustomFetch.mock.calls[0][0]).toContain('/a%2F1%3Fx');
  });
});

describe('updateAiApp', () => {
  beforeEach(() => jest.clearAllMocks());

  it('PATCHes JSON and keeps an explicit prd null in the body (clear signal)', async () => {
    mockCustomFetch.mockResolvedValue(jsonResponse(200, { uid: 'a1' }));
    const result = await updateAiApp('a1', { name: 'New name', prd: null });

    expect(result).toEqual({ app: { uid: 'a1' }, error: null });
    const [url, init] = mockCustomFetch.mock.calls[0];
    expect(url).toContain('/a1');
    expect(init).toMatchObject({ method: 'PATCH' });
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ name: 'New name', prd: null });
  });

  it('surfaces the backend message on a 400', async () => {
    mockCustomFetch.mockResolvedValue(jsonResponse(400, { message: 'Name too long' }));
    await expect(updateAiApp('a1', { name: 'x' })).resolves.toEqual({ app: null, error: 'Name too long' });
  });

  it('maps a 404 to a fixed already-gone message', async () => {
    mockCustomFetch.mockResolvedValue(jsonResponse(404, { message: 'ignored' }));
    const result = await updateAiApp('a1', { name: 'x' });
    expect(result.app).toBeNull();
    expect(result.error).toMatch(/no longer exists/i);
  });

  it('returns a generic error when the request never went out', async () => {
    mockCustomFetch.mockResolvedValue(undefined as unknown as Response);
    const result = await updateAiApp('a1', { name: 'x' });
    expect(result.app).toBeNull();
    expect(result.error).toBeTruthy();
  });
});

describe('deleteAiApp', () => {
  beforeEach(() => jest.clearAllMocks());

  it('resolves ok on 200', async () => {
    mockCustomFetch.mockResolvedValue(jsonResponse(200));
    await expect(deleteAiApp('a1')).resolves.toEqual({ ok: true, error: null });
  });

  it('treats 404 as success — the app is already gone', async () => {
    mockCustomFetch.mockResolvedValue(jsonResponse(404));
    await expect(deleteAiApp('a1')).resolves.toEqual({ ok: true, error: null });
  });

  it('surfaces backend errors on other failures', async () => {
    mockCustomFetch.mockResolvedValue(jsonResponse(403, { message: 'Not allowed' }));
    await expect(deleteAiApp('a1')).resolves.toEqual({ ok: false, error: 'Not allowed' });
  });
});

describe('hasPrd', () => {
  it.each([
    [undefined, false],
    [null, false],
    ['', false],
    ['   \n ', false],
    ['# Hello', true],
    ['<!doctype html><html></html>', true],
  ])('hasPrd(%p) === %p', (prd, expected) => {
    expect(hasPrd({ prd })).toBe(expected);
  });
});
