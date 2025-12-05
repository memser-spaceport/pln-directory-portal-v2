import { generateOAuth2State } from '@/utils/auth.utils';

export const renewAccessToken = async (refreshToken: string) => {
  const body = JSON.stringify({ refreshToken, grantType: 'refresh_token' });
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body,
  });

  const result = await response.json();
  return { ok: response?.ok, data: result, status: response?.status };
};

export const checkIsValidToken = async (token: string) => {
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');
  const validateResponse = await fetch(`${process.env.AUTH_API_URL}/auth/introspect`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ token }),
    cache: 'no-store',
  });
  const validateResult = await validateResponse.json();
  // console.log('auth.service validateResult', validateResult);

  if (!validateResponse?.ok) {
    return null;
  }

  return validateResult;
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
  retries = 3
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
        const data = response.ok ? await response.json() : null;
        return { ok: response.ok, data, status: response.status };
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
