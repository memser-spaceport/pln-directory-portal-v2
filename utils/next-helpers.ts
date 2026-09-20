import { headers } from 'next/headers';
import { getParsedValue } from './common.utils';

export async function getCookiesFromHeaders() {
  const headersList = await headers();
  const authToken = getParsedValue(headersList?.get('authToken') as string);
  const userInfo = getParsedValue(headersList?.get('userInfo') as any);
  const refreshToken = getParsedValue(headersList?.get('refreshToken') as any);
  /* Coerced, because `getParsedValue` answers `''` for a header that is absent
     — which it is for every signed-out request — and every consumer declares
     this prop as `boolean`. The type was telling the truth about the intent and
     lying about the value.

     It is not merely cosmetic: React Query v5 validates `enabled` and throws
     `Expected enabled to be a boolean or a callback that returns a boolean`, so
     any hook handed this value straight through crashed the tree for signed-out
     visitors rather than simply not fetching. `''` and `false` are both falsy,
     so nothing that merely tests it changes behaviour. */
  const isLoggedIn = !!getParsedValue(headersList?.get('isLoggedIn') as any);

  return { authToken, userInfo, refreshToken, isLoggedIn };
}
