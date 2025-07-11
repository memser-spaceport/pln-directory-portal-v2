import { NextRequest, NextResponse } from 'next/server';
import { checkIsValidToken, renewAccessToken } from './services/auth.service';
import { calculateExpiry, decodeToken } from './utils/auth.utils';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - icons (icons file)
     * - images (image file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icons|images).*)',
    '/teams/:path',
    '/members/:path',
    '/projects/:path',
    '/events/irl/:path',
    '/settings/:path',
    '/changelog',
    '/husky/chat/:path',
    '/events',
  ],
};

export async function middleware(req: NextRequest) {
  const response = NextResponse.next();
  const refreshTokenFromCookie = req?.cookies?.get('refreshToken');
  const authTokenFromCookie = req?.cookies?.get('authToken');
  const userInfo = req?.cookies?.get('userInfo');
  let isValidAuthToken = false;

  try {
    if (!refreshTokenFromCookie) {
      response.cookies.delete('refreshToken');
      response.cookies.delete('authToken');
      response.cookies.delete('userInfo');
      return response;
    }

    const authToken = authTokenFromCookie?.value.replace(/"/g, '');
    if (authToken) {
      const validCheckResponse = await checkIsValidToken(authToken as string);

      // Priority 1: Check for force logout (regardless of active status)
      console.log('middleware validCheckResponse', validCheckResponse);
      if (validCheckResponse?.forceLogout) {
        console.log('middleware inside middleware forceLogout');
        response.cookies.delete('refreshToken');
        response.cookies.delete('authToken');
        response.cookies.delete('userInfo');
        return response;
      }

      // Priority 2: Check if token is active
      isValidAuthToken = (validCheckResponse && validCheckResponse?.active) || false;
      if (isValidAuthToken) {
        console.log('middleware inside isValidAuthToken');
        response.headers.set('refreshToken', refreshTokenFromCookie?.value as string);
        response.headers.set('authToken', authTokenFromCookie?.value as string);
        response.headers.set('userInfo', userInfo?.value as string);
        response.headers.set('isLoggedIn', 'true');
        return response;
      }
    }

    if ((!authTokenFromCookie || !isValidAuthToken || !userInfo) && refreshTokenFromCookie) {
      console.log('middleware inside refresh token');
      const renewAccessTokenResponse = await renewAccessToken(refreshTokenFromCookie?.value.replace(/"/g, ''));
      const { accessToken, refreshToken, userInfo } = renewAccessTokenResponse?.data;

      const accessTokenExpiry = decodeToken(accessToken) as any;
      const refreshTokenExpiry = decodeToken(refreshToken) as any;
      if (accessToken && refreshToken && userInfo) {
        response.cookies.set('refreshToken', JSON.stringify(refreshToken), {
          maxAge: calculateExpiry(refreshTokenExpiry?.exp),
          domain: process.env.COOKIE_DOMAIN,
        });
        response.cookies.set('authToken', JSON.stringify(accessToken), {
          maxAge: calculateExpiry(accessTokenExpiry?.exp),
          domain: process.env.COOKIE_DOMAIN,
        });
        response.cookies.set('userInfo', JSON.stringify(userInfo), {
          maxAge: calculateExpiry(accessTokenExpiry?.exp),
          domain: process.env.COOKIE_DOMAIN,
        });
        response.headers.set('refreshToken', JSON.stringify(refreshToken));
        response.headers.set('authToken', JSON.stringify(accessToken));
        response.headers.set('userInfo', JSON.stringify(userInfo));
        response.headers.set('isLoggedIn', 'true');
        return response;
      }
    } else {
      response.cookies.delete('refreshToken');
      response.cookies.delete('authToken');
      response.cookies.delete('userInfo');
      return response;
    }
  } catch (err) {
    console.log(err);
    response.cookies.delete('refreshToken');
    response.cookies.delete('authToken');
    response.cookies.delete('userInfo');
    return response;
  }
}
