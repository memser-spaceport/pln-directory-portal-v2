import { headers } from 'next/headers';
import { getParsedValue } from './common.utils';

export function getCookiesFromHeaders() {
  const headersList = headers();
  const authToken = getParsedValue(headersList?.get('authToken') as string);
  const userInfo = getParsedValue(headersList?.get('userInfo') as any);
  const refreshToken = getParsedValue(headersList?.get('refreshToken') as any);
  const isLoggedIn = getParsedValue(headersList?.get('isLoggedIn') as any);
  const middlewareStartTime = getParsedValue(headersList?.get('middlewareStartTime') as any)
  const middlewareEndTime = getParsedValue(headersList.get('middlewareEndTime') as any)
  const middlewareAuthStart = getParsedValue(headersList.get('middlewareAuthStart') as any)
  const middlewareAuthEnd = getParsedValue(headersList.get('middlewareAuthEnd') as any)

  return { authToken, userInfo, refreshToken, isLoggedIn, middlewareStartTime, middlewareEndTime, middlewareAuthStart, middlewareAuthEnd };
}