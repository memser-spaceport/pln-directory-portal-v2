import Cookies from 'js-cookie';

import { endSession } from '@/services/session.service';
import {
  clearAllAuthCookies,
  expireSharedCookie,
  getSessionExpiry,
  hasSession,
  setSessionCookie,
} from '@/utils/third-party.helper';

jest.mock('js-cookie', () => ({
  __esModule: true,
  default: { set: jest.fn(), remove: jest.fn(), get: jest.fn() },
}));

jest.mock('@/services/session.service', () => ({ endSession: jest.fn().mockResolvedValue(undefined) }));

const mockedCookies = Cookies as jest.Mocked<typeof Cookies>;
const DOMAIN = '.os.pl.xyz';
const EXPIRES = new Date('2030-01-01T00:00:00Z');
// jsdom serves the page on http://localhost: no Secure there (local dev); SameSite=Lax always.
const FLAGS = { path: '/', sameSite: 'lax', secure: false };

describe('LabOS session cookie helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.COOKIE_DOMAIN = DOMAIN;
  });

  it('writes userInfo host-only with the session flags and removes the shared copy first', () => {
    const name = 'userInfo';
    setSessionCookie(name, '"value"', { expires: EXPIRES, domain: DOMAIN });

    expect(mockedCookies.remove).toHaveBeenCalledWith(name, { path: '/', domain: DOMAIN });
    expect(mockedCookies.set).toHaveBeenCalledWith(name, '"value"', { ...FLAGS, expires: EXPIRES });
    expect(mockedCookies.remove.mock.invocationCallOrder[0]).toBeLessThan(
      mockedCookies.set.mock.invocationCallOrder[0],
    );
  });

  it('keeps authToken on COOKIE_DOMAIN, where deployed AI Apps read it', () => {
    setSessionCookie('authToken', '"jwt"', { expires: EXPIRES });

    expect(mockedCookies.set).toHaveBeenCalledWith('authToken', '"jwt"', {
      ...FLAGS,
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
      expect(mockedCookies.set).toHaveBeenCalledWith('authToken', '"jwt"', { ...FLAGS, expires: EXPIRES });
    } finally {
      delete process.env.AI_APPS_SHARE_AUTH_TOKEN;
    }
  });

  it('touches no domain when COOKIE_DOMAIN is empty (local dev)', () => {
    process.env.COOKIE_DOMAIN = '';

    setSessionCookie('userInfo', '"u"', { expires: EXPIRES });
    expireSharedCookie('userInfo');

    expect(mockedCookies.remove).not.toHaveBeenCalled();
    expect(mockedCookies.set).toHaveBeenCalledWith('userInfo', '"u"', { ...FLAGS, expires: EXPIRES });
  });

  it('refuses to write refreshToken: it is httpOnly and only the server sets it', () => {
    expect(() => setSessionCookie('refreshToken', '"r"', { expires: EXPIRES })).toThrow();
    expect(mockedCookies.set).not.toHaveBeenCalled();
  });

  it('reads the session from the script-readable marker', () => {
    mockedCookies.get.mockImplementation(((name: string) =>
      name === 'sessionExpiresAt' ? '1893456000' : undefined) as any);
    expect(hasSession()).toBe(true);
    expect(getSessionExpiry()).toEqual(new Date(1893456000 * 1000));

    mockedCookies.get.mockReturnValue(undefined as any);
    expect(hasSession()).toBe(false);
    expect(getSessionExpiry()).toBeNull();
  });

  it('logout revokes the member’s AI App sessions with the current token, fire-and-forget', async () => {
    process.env.DIRECTORY_API_URL = 'https://api.test';
    mockedCookies.get.mockImplementation(((name: string) => (name === 'authToken' ? '"jwt"' : undefined)) as any);
    const fetchMock = jest.fn().mockRejectedValue(new Error('offline'));
    (global as any).fetch = fetchMock;
    Object.defineProperty(window, 'localStorage', { value: { clear: jest.fn() }, configurable: true });

    await expect(clearAllAuthCookies()).resolves.toBeUndefined();
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

  it('logout without a token makes no revoke call', async () => {
    mockedCookies.get.mockReturnValue(undefined as any);
    const fetchMock = jest.fn();
    (global as any).fetch = fetchMock;
    Object.defineProperty(window, 'localStorage', { value: { clear: jest.fn() }, configurable: true });

    await clearAllAuthCookies();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['localhost', '127.0.0.1'])(
    'never expires a "shared" copy on %s, where it would be the host-only cookie itself',
    (domain) => {
      process.env.COOKIE_DOMAIN = domain;

      setSessionCookie('userInfo', '"u"', { expires: EXPIRES });
      expireSharedCookie('userInfo');

      expect(mockedCookies.remove).not.toHaveBeenCalled();
      expect(mockedCookies.set).toHaveBeenCalledWith('userInfo', '"u"', { ...FLAGS, expires: EXPIRES });
    },
  );

  it('logout ends the session on the server (httpOnly refreshToken) before clearing the readable cookies', async () => {
    Object.defineProperty(window, 'localStorage', { value: { clear: jest.fn() }, configurable: true });

    await clearAllAuthCookies();

    expect(endSession).toHaveBeenCalled();
    expect((endSession as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan(
      mockedCookies.remove.mock.invocationCallOrder[0],
    );
    for (const name of ['authToken', 'userInfo', 'sessionScope', 'sessionExpiresAt']) {
      expect(mockedCookies.remove).toHaveBeenCalledWith(name, { path: '/' });
      expect(mockedCookies.remove).toHaveBeenCalledWith(name, { path: '/', domain: DOMAIN });
    }
  });
});
