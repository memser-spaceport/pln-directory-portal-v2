import { getCookiesFromHeaders } from '@/utils/next-helpers';

const mockGet = jest.fn();
jest.mock('next/headers', () => ({
  headers: () => Promise.resolve({ get: (name: string) => mockGet(name) }),
}));

/**
 * `isLoggedIn` reaches half the app as a prop declared `boolean`, and several
 * consumers hand it straight to React Query's `enabled` — which v5 validates
 * and throws on. A signed-out request carries no `isLoggedIn` header at all, so
 * before this was coerced the value was `''`: falsy, so every `if` behaved, and
 * fatal the moment anything treated it as the boolean its type claimed.
 */
describe('getCookiesFromHeaders', () => {
  beforeEach(() => jest.clearAllMocks());

  const headersSaying = (values: Record<string, string | null>) => {
    mockGet.mockImplementation((name: string) => values[name] ?? null);
  };

  it('reports a signed-out visitor as false, not as an empty string', async () => {
    headersSaying({});

    const { isLoggedIn } = await getCookiesFromHeaders();

    expect(isLoggedIn).toBe(false);
    expect(typeof isLoggedIn).toBe('boolean');
  });

  it('reports a signed-in member as true', async () => {
    headersSaying({ isLoggedIn: 'true' });

    const { isLoggedIn } = await getCookiesFromHeaders();

    expect(isLoggedIn).toBe(true);
  });

  it('survives a header that is not valid JSON', async () => {
    headersSaying({ isLoggedIn: '%%%not-json%%%' });

    const { isLoggedIn } = await getCookiesFromHeaders();

    expect(isLoggedIn).toBe(false);
  });

  it('reports an explicit false as false', async () => {
    headersSaying({ isLoggedIn: 'false' });

    const { isLoggedIn } = await getCookiesFromHeaders();

    expect(isLoggedIn).toBe(false);
  });

  // The coercion is scoped to `isLoggedIn`; the other three are values, not
  // flags, and callers rely on their shapes.
  it('leaves the other cookies alone', async () => {
    headersSaying({ authToken: '"tok"', userInfo: '%7B%22uid%22%3A%22m-1%22%7D' });

    const { authToken, userInfo, refreshToken } = await getCookiesFromHeaders();

    expect(authToken).toBe('tok');
    expect(userInfo).toEqual({ uid: 'm-1' });
    expect(refreshToken).toBe('');
  });
});
