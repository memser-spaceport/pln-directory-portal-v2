import { headers } from 'next/headers';
import { getParsedValue } from './common.utils';

export async function getCookiesFromHeaders() {
  const headersList = await headers();
  const authToken = getParsedValue(headersList?.get('authToken') as string);
  const userInfo = getParsedValue(headersList?.get('userInfo') as any);
  const refreshToken = getParsedValue(headersList?.get('refreshToken') as any);
  const isLoggedIn = getParsedValue(headersList?.get('isLoggedIn') as any);

  return { authToken, userInfo, refreshToken, isLoggedIn };
}
