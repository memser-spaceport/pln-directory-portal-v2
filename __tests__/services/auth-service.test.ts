/**
 * @jest-environment node
 */
import {
  AuthServiceUnavailableError,
  checkIsValidToken,
  isTransientRefreshFailure,
  renewAccessToken,
} from '@/services/auth.service';

const fetchMock = jest.fn();

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function htmlResponse(status: number) {
  return new Response('<html>bad gateway</html>', { status, headers: { 'content-type': 'text/html' } });
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.AUTH_API_URL = 'https://auth.example';
  process.env.DIRECTORY_API_URL = 'https://dir.example';
  (global as any).fetch = fetchMock;
});

describe('checkIsValidToken', () => {
  it('returns an active token without a retry', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { active: true, email: 'ada@example.com' }));

    await expect(checkIsValidToken('access.jwt')).resolves.toEqual({ active: true, email: 'ada@example.com' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('https://auth.example/auth/introspect');
    expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });

  it.each([400, 401])('treats HTTP %s as an inactive token and does not retry', async (status) => {
    fetchMock.mockResolvedValue(jsonResponse(status, { errorCode: 'EATH005' }));

    await expect(checkIsValidToken('access.jwt')).resolves.toEqual({ active: false });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries a timeout and a 502, then returns the next answer', async () => {
    fetchMock
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce(htmlResponse(502))
      .mockResolvedValueOnce(jsonResponse(200, { active: true }));

    await expect(checkIsValidToken('access.jwt')).resolves.toEqual({ active: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('throws after the retries when the auth service stays down', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    await expect(checkIsValidToken('access.jwt')).rejects.toBeInstanceOf(AuthServiceUnavailableError);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('throws when a 2xx body is not JSON', async () => {
    fetchMock.mockResolvedValue(htmlResponse(200));

    await expect(checkIsValidToken('access.jwt')).rejects.toBeInstanceOf(AuthServiceUnavailableError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws after retrying HTTP 429', async () => {
    fetchMock.mockResolvedValue(jsonResponse(429, { message: 'slow down' }));

    await expect(checkIsValidToken('access.jwt')).rejects.toBeInstanceOf(AuthServiceUnavailableError);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

describe('renewAccessToken', () => {
  it('does not retry a rejected refresh token', async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { message: 'Unauthorized' }));

    await expect(renewAccessToken('refresh.jwt')).resolves.toEqual({
      ok: false,
      data: { message: 'Unauthorized' },
      status: 401,
      transient: false,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('https://dir.example/v1/auth/token');
  });

  it('retries an HTML 502 and returns the next tokens', async () => {
    fetchMock
      .mockResolvedValueOnce(htmlResponse(502))
      .mockResolvedValueOnce(jsonResponse(200, { accessToken: 'a2', refreshToken: 'r2', userInfo: { uid: 'm-1' } }));

    await expect(renewAccessToken('refresh.jwt')).resolves.toEqual({
      ok: true,
      data: { accessToken: 'a2', refreshToken: 'r2', userInfo: { uid: 'm-1' } },
      status: 200,
      transient: false,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('reports a network failure as transient after the retry', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    await expect(renewAccessToken('refresh.jwt')).resolves.toEqual({
      ok: false,
      data: null,
      status: 0,
      transient: true,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('reports an HTML 504 as transient and does not throw', async () => {
    fetchMock.mockResolvedValue(htmlResponse(504));

    await expect(renewAccessToken('refresh.jwt')).resolves.toEqual({
      ok: false,
      data: null,
      status: 504,
      transient: true,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('isTransientRefreshFailure', () => {
  it('treats 429 and 5xx as an outage even without the flag', () => {
    expect(isTransientRefreshFailure({ status: 503 })).toBe(true);
    expect(isTransientRefreshFailure({ status: 429 })).toBe(true);
    expect(isTransientRefreshFailure({ status: 401, transient: false })).toBe(false);
    expect(isTransientRefreshFailure({ transient: true, status: 0 })).toBe(true);
  });
});
