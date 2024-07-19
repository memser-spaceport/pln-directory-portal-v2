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
  if (!validateResponse?.ok || !validateResult?.active) {
    return false;
  }
  return true;
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
