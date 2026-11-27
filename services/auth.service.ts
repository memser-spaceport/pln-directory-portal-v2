import { generateOAuth2State } from '@/utils/auth.utils';

const INTROSPECT_TIMEOUT_MS = 3000;
const INTROSPECT_RETRY_DELAYS_MS = [200, 500];
const REFRESH_TIMEOUT_MS = 4000;
const REFRESH_RETRY_DELAYS_MS = [200];

/** The auth service did not give a definitive answer. The session must stay. */
export class AuthServiceUnavailableError extends Error {
  constructor(message = 'Authentication service unavailable') {
    super(message);
    this.name = 'AuthServiceUnavailableError';
  }
}

export interface RenewAccessTokenResult {
  ok: boolean;
  data: {
    accessToken?: string;
    refreshToken?: string;
    userInfo?: { uid?: string };
  } | null;
  status: number;
  transient: boolean;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isTransientHttpStatus = (status: number) => status === 429 || status >= 500;

/** A mocked caller can omit `transient`. HTTP 429 and 5xx still count as an outage. */
export const isTransientRefreshFailure = (result: { transient?: boolean; status?: number } | null | undefined) => {
  if (!result) return false;
  if (result.transient) return true;
  const status = result.status ?? 0;
  return status === 429 || status >= 500;
};

async function readJsonBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  retryDelaysMs: number[],
): Promise<Response> {
  const attempts = retryDelaysMs.length + 1;
  let lastResponse: Response | null = null;
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
      if (!isTransientHttpStatus(response.status)) return response;
      lastResponse = response;
    } catch (error) {
      lastError = error;
      lastResponse = null;
    }
    if (attempt < attempts - 1) await wait(retryDelaysMs[attempt]);
  }

  if (lastResponse) return lastResponse;
  const message = lastError instanceof Error ? lastError.message : 'Authentication service unavailable';
  throw new AuthServiceUnavailableError(message);
}

export const renewAccessToken = async (refreshToken: string): Promise<RenewAccessTokenResult> => {
  const body = JSON.stringify({ refreshToken, grantType: 'refresh_token' });
  try {
    const response = await fetchWithRetry(
      `${process.env.DIRECTORY_API_URL}/v1/auth/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body,
      },
      REFRESH_TIMEOUT_MS,
      REFRESH_RETRY_DELAYS_MS,
    );
    const data = await readJsonBody(response);
    const parsed = data && typeof data === 'object' ? (data as RenewAccessTokenResult['data']) : null;
    const transient = isTransientHttpStatus(response.status) || (response.ok && parsed === null);
    return { ok: response.ok && !transient, data: parsed, status: response.status, transient };
  } catch {
    return { ok: false, data: null, status: 0, transient: true };
  }
};

export const checkIsValidToken = async (token: string) => {
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');
  const validateResponse = await fetchWithRetry(
    `${process.env.AUTH_API_URL}/auth/introspect`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ token }),
      cache: 'no-store',
    },
    INTROSPECT_TIMEOUT_MS,
    INTROSPECT_RETRY_DELAYS_MS,
  );

  if (isTransientHttpStatus(validateResponse.status)) {
    throw new AuthServiceUnavailableError();
  }
  if (validateResponse.status >= 400 && validateResponse.status < 500) {
    return { active: false };
  }

  const validateResult = await readJsonBody(validateResponse);
  if (!validateResponse.ok || validateResult === null || typeof validateResult !== 'object') {
    throw new AuthServiceUnavailableError();
  }
  return validateResult as { active?: boolean; forceLogout?: boolean };
};

export const createStateUid = async () => {
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      state: generateOAuth2State(),
    }),
  });

  const result = await response.text();
  return { ok: response?.ok, data: result, status: response?.status };
};

export const deletePrivyUser = async (token: string, userId: string) => {
  return await fetch(`${process.env.DIRECTORY_API_URL}/v1/auth/accounts/external/${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token: token }),
  });
};

export const reportLinkIssue = async (data: { name: string; email: string }) => {
  return await fetch(`${process.env.DIRECTORY_API_URL}/v1/auth/report-link-issue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
};

export interface TokenExchangeResponse {
  accessToken: string;
  refreshToken: string;
  userInfo: {
    uid: string;
    email?: string;
    name?: string;
    isFirstTimeLogin?: boolean;
  };
  isDeleteAccount?: boolean;
}

export interface TokenExchangeResult {
  ok: boolean;
  data: TokenExchangeResponse | null;
  status: number;
  error?: string;
}

/**
 * Exchange Privy token for directory tokens with retry support
 */
export const exchangeToken = async (
  privyToken: string,
  stateUid: string,
  retries = 3,
): Promise<TokenExchangeResult> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exchangeRequestToken: privyToken,
          exchangeRequestId: stateUid,
          grantType: 'token_exchange',
        }),
      });

      // Don't retry on client errors (4xx) - only on server errors (5xx) or network issues
      if (response.status >= 400 && response.status < 500) {
        let error: string | undefined;

        try {
          const body = await response.json();
          error = body?.message || body?.error;
        } catch {
          // Response body can be empty or non-JSON
        }

        return {
          ok: false,
          data: null,
          status: response.status,
          error,
        };
      }

      if (response.ok) {
        const data = await response.json();
        return { ok: true, data, status: response.status };
      }

      // Server error - will retry
      lastError = new Error(`Server error: ${response.status}`);
    } catch (err) {
      lastError = err as Error;
    }

    // Wait before retry (exponential backoff)
    if (attempt < retries - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }

  return {
    ok: false,
    data: null,
    status: 500,
    error: lastError?.message || 'Token exchange failed after retries',
  };
};

/**
 * Redeem a short-lived invite login token for directory session tokens
 */
export const redeemLoginToken = async (token: string): Promise<TokenExchangeResult> => {
  try {
    const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/auth/login-token/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
      cache: 'no-store',
    });

    let data: TokenExchangeResponse | null = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    return { ok: response.ok, data, status: response.status };
  } catch (err) {
    return {
      ok: false,
      data: null,
      status: 500,
      error: (err as Error).message || 'Login token redeem failed',
    };
  }
};
