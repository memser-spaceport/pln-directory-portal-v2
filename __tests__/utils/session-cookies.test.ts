import Cookies from 'js-cookie';

import { clearAllAuthCookies, expireSharedCookie, setSessionCookie } from '@/utils/third-party.helper';

jest.mock('js-cookie', () => ({
  __esModule: true,
  default: { set: jest.fn(), remove: jest.fn(), get: jest.fn() },
}));

const mockedCookies = Cookies as jest.Mocked<typeof Cookies>;
const DOMAIN = '.os.pl.xyz';
const EXPIRES = new Date('2030-01-01T00:00:00Z');

describe('LabOS session cookie helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.COOKIE_DOMAIN = DOMAIN;
  });

  it.each(['refreshToken', 'userInfo'])('writes %s host-only and removes the shared copy first', (name) => {
    setSessionCookie(name, '"value"', { expires: EXPIRES, domain: DOMAIN });

    expect(mockedCookies.remove).toHaveBeenCalledWith(name, { path: '/', domain: DOMAIN });
    expect(mockedCookies.set).toHaveBeenCalledWith(name, '"value"', { path: '/', expires: EXPIRES });
    expect(mockedCookies.remove.mock.invocationCallOrder[0]).toBeLessThan(
      mockedCookies.set.mock.invocationCallOrder[0],
    );
  });

  it('keeps authToken on COOKIE_DOMAIN, where deployed AI Apps read it', () => {
    setSessionCookie('authToken', '"jwt"', { expires: EXPIRES });

    expect(mockedCookies.set).toHaveBeenCalledWith('authToken', '"jwt"', {
      path: '/',
      expires: EXPIRES,
      domain: DOMAIN,
    });
    expect(mockedCookies.remove).not.toHaveBeenCalled();
  });

  it('writes authToken host-only once LabOS stops sharing it (AI_APPS_SHARE_AUTH_TOKEN=false)', () => {
    process.env.AI_APPS_SHARE_AUTH_TOKEN = 'false';
    try {
      setSessionCookie('authToken', '"jwt"', { expires: EXPIRES });
      expect(mockedCookies.remove).toHaveBeenCalledWith('authToken', { path: '/', domain: DOMAIN });
      expect(mockedCookies.set).toHaveBeenCalledWith('authToken', '"jwt"', { path: '/', expires: EXPIRES });
    } finally {
      delete process.env.AI_APPS_SHARE_AUTH_TOKEN;
    }
  });

  it('touches no domain when COOKIE_DOMAIN is empty (local dev)', () => {
    process.env.COOKIE_DOMAIN = '';

    setSessionCookie('refreshToken', '"r"', { expires: EXPIRES });
    expireSharedCookie('userInfo');

    expect(mockedCookies.remove).not.toHaveBeenCalled();
    expect(mockedCookies.set).toHaveBeenCalledWith('refreshToken', '"r"', { path: '/', expires: EXPIRES });
  });

  it('logout revokes the member’s AI App sessions with the current token, fire-and-forget', () => {
    process.env.DIRECTORY_API_URL = 'https://api.test';
    mockedCookies.get.mockImplementation(((name: string) => (name === 'authToken' ? '"jwt"' : undefined)) as any);
    const fetchMock = jest.fn().mockRejectedValue(new Error('offline'));
    (global as any).fetch = fetchMock;
    Object.defineProperty(window, 'localStorage', { value: { clear: jest.fn() }, configurable: true });

    expect(() => clearAllAuthCookies()).not.toThrow();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test/v1/ai-apps/sessions/revoke',
      expect.objectContaining({
        method: 'POST',
        keepalive: true,
        headers: { Authorization: 'Bearer jwt', 'Content-Type': 'application/json' },
      }),
    );
    expect(mockedCookies.remove).toHaveBeenCalledWith('authToken', { path: '/' });
  });

  it('logout without a token makes no revoke call', () => {
    mockedCookies.get.mockReturnValue(undefined as any);
    const fetchMock = jest.fn();
    (global as any).fetch = fetchMock;
    Object.defineProperty(window, 'localStorage', { value: { clear: jest.fn() }, configurable: true });

    clearAllAuthCookies();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['localhost', '127.0.0.1'])(
    'never expires a "shared" copy on %s, where it would be the host-only cookie itself',
    (domain) => {
      process.env.COOKIE_DOMAIN = domain;

      setSessionCookie('refreshToken', '"r"', { expires: EXPIRES });
      expireSharedCookie('userInfo');

      expect(mockedCookies.remove).not.toHaveBeenCalled();
      expect(mockedCookies.set).toHaveBeenCalledWith('refreshToken', '"r"', { path: '/', expires: EXPIRES });
    },
  );

  it('logout clears host-only and shared copies, including the migration marker', () => {
    Object.defineProperty(window, 'localStorage', { value: { clear: jest.fn() }, configurable: true });

    clearAllAuthCookies();

    for (const name of ['authToken', 'refreshToken', 'userInfo', 'sessionScope']) {
      expect(mockedCookies.remove).toHaveBeenCalledWith(name, { path: '/' });
      expect(mockedCookies.remove).toHaveBeenCalledWith(name, { path: '/', domain: DOMAIN });
    }
  });
});
