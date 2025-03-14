import { headers } from 'next/headers';
import { getParsedValue } from './common.utils';

export function getCookiesFromHeaders() {
  const headersList = headers();
  const authToken = getParsedValue(headersList?.get(`${process.env.COOKIE_PREFIX}-authToken`) as string);
  const userInfo = getParsedValue(headersList?.get(`${process.env.COOKIE_PREFIX}-userInfo`) as any);
  const refreshToken = getParsedValue(headersList?.get(`${process.env.COOKIE_PREFIX}-refreshToken`) as any);
  const isLoggedIn = getParsedValue(headersList?.get(`${process.env.COOKIE_PREFIX}-isLoggedIn`) as any);

  return { authToken, userInfo, refreshToken, isLoggedIn };
}