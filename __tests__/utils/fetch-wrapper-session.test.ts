import Cookies from 'js-cookie';

import { customFetch, getUserCredentialsInfo } from '@/utils/fetch-wrapper';
import { refreshSession } from '@/services/session.service';
import { clearAllAuthCookies, hasSession } from '@/utils/third-party.helper';

jest.mock('js-cookie', () => ({
  __esModule: true,
  default: { get: jest.fn(), set: jest.fn(), remove: jest.fn() },
}));
jest.mock('@/services/session.service', () => ({ refreshSession: jest.fn() }));
jest.mock('@/utils/third-party.helper', () => ({ clearAllAuthCookies: jest.fn(), hasSession: jest.fn() }));
jest.mock('@/components/core/ToastContainer', () => ({ toast: { success: jest.fn() } }));
jest.mock('@/components/core/login/utils', () => ({ authEvents: { emit: jest.fn() } }));

const mockedGet = Cookies.get as unknown as jest.Mock;
const mockedRefresh = refreshSession as jest.Mock;
const mockedHasSession = hasSession as jest.Mock;
const mockedClear = clearAllAuthCookies as jest.Mock;

const reload = jest.fn();
const fetchMock = jest.fn();

function cookies(values: Record<string, string>) {
  mockedGet.mockImplementation((name: string) => values[name]);
}

beforeAll(() => {
  // jsdom has no fetch Response; the wrapper builds one for a failed retry.
  (global as any).Response ??= class {
    ok: boolean;
    status: number;
    constructor(_body: unknown, init: { status: number }) {
      this.status = init.status;
      this.ok = init.status < 400;
    }
  };
  Object.defineProperty(window, 'location', { configurable: true, value: { ...window.location, reload } });
});

beforeEach(() => {
  jest.clearAllMocks();
  (global as any).fetch = fetchMock;
  mockedHasSession.mockReturnValue(true);
  mockedClear.mockResolvedValue(undefined);
});

describe('customFetch with an httpOnly refresh token', () => {
  it('renews through the server when the access token is gone, then calls with the new one', async () => {
    cookies({});
    mockedRefresh.mockResolvedValue({ accessToken: 'access2', userInfo: { uid: 'm-1' } });
    fetchMock.mockResolvedValue({ ok: true, status: 200 });

    await customFetch('https://api.test/x', { headers: {} }, true);

    expect(mockedRefresh).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('https://api.test/x', { headers: { Authorization: 'Bearer access2' } });
    expect(mockedClear).not.toHaveBeenCalled();
  });

  it('retries a 401 once with a renewed token', async () => {
    cookies({ authToken: JSON.stringify('old') });
    mockedRefresh.mockResolvedValue({ accessToken: 'access2', userInfo: { uid: 'm-1' } });
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401 }).mockResolvedValueOnce({ ok: true, status: 200 });

    const res = await customFetch('https://api.test/x', { headers: {} }, true);

    expect(res).toEqual({ ok: true, status: 200 });
    expect(fetchMock.mock.calls.map(([, o]) => o.headers.Authorization)).toEqual(['Bearer old', 'Bearer access2']);
  });

  it('signs out and waits for the server sign-out before reloading when the refresh fails', async () => {
    cookies({ authToken: JSON.stringify('old') });
    mockedRefresh.mockResolvedValue(null);
    fetchMock.mockResolvedValue({ ok: false, status: 401 });
    let signedOut = false;
    mockedClear.mockImplementation(async () => {
      await Promise.resolve();
      signedOut = true;
    });
    reload.mockImplementation(() => expect(signedOut).toBe(true));

    await customFetch('https://api.test/x', { headers: {} }, true);

    expect(mockedClear).toHaveBeenCalled();
    expect(reload).toHaveBeenCalled();
  });

  it('signs out without calling the API when there is no session', async () => {
    mockedHasSession.mockReturnValue(false);
    cookies({ authToken: JSON.stringify('old') });

    await customFetch('https://api.test/x', { headers: {} }, true);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(mockedRefresh).not.toHaveBeenCalled();
    expect(mockedClear).toHaveBeenCalled();
  });
});

describe('getUserCredentialsInfo', () => {
  it('never returns a refresh token', async () => {
    cookies({});
    mockedRefresh.mockResolvedValue({ accessToken: 'access2', userInfo: { uid: 'm-1' } });

    const result = await getUserCredentialsInfo();

    expect(result).toEqual({ newAuthToken: 'access2', newUserInfo: { uid: 'm-1' } });
  });

  it('asks for login when the session cannot be renewed', async () => {
    cookies({});
    mockedRefresh.mockResolvedValue(null);

    expect(await getUserCredentialsInfo()).toEqual(expect.objectContaining({ isLoginRequired: true }));
  });
});
