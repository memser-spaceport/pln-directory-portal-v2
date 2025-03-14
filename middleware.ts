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
    '/irl/:path',
    '/settings/:path',
    '/changelog',
  ],
};

export async function middleware(req: NextRequest) {
  const response = NextResponse.next();
  const refreshTokenFromCookie = req?.cookies?.get(`${process.env.COOKIE_PREFIX}-refreshToken`);
  const authTokenFromCookie = req?.cookies?.get(`${process.env.COOKIE_PREFIX}-authToken`);
  const userInfo = req?.cookies?.get(`${process.env.COOKIE_PREFIX}-userInfo`);
  let isValidAuthToken = false;

  try {
    if (!refreshTokenFromCookie) {
      return response;
    }

    const authToken = authTokenFromCookie?.value.replace(/"/g, '');
    if (authToken) {
      isValidAuthToken = await checkIsValidToken(authToken as string);
      if (isValidAuthToken) {
        response.headers.set(`${process.env.COOKIE_PREFIX}-refreshToken`, refreshTokenFromCookie?.value as string);
        response.headers.set(`${process.env.COOKIE_PREFIX}-authToken`, authTokenFromCookie?.value as string);
        response.headers.set(`${process.env.COOKIE_PREFIX}-userInfo`, userInfo?.value as string);
        response.headers.set(`${process.env.COOKIE_PREFIX}-isLoggedIn`, 'true');
        return response;
      }
    }

    if ((!authTokenFromCookie || !isValidAuthToken || !userInfo) && refreshTokenFromCookie) {
      const renewAccessTokenResponse = await renewAccessToken(refreshTokenFromCookie?.value.replace(/"/g, ''));
      const { accessToken, refreshToken, userInfo } = renewAccessTokenResponse?.data;

      const accessTokenExpiry = decodeToken(accessToken) as any;
      const refreshTokenExpiry = decodeToken(refreshToken) as any;
      if (accessToken && refreshToken && userInfo) {
        response.cookies.set(`${process.env.COOKIE_PREFIX}-refreshToken`, JSON.stringify(refreshToken), {
          maxAge: calculateExpiry(refreshTokenExpiry?.exp),
          domain: process.env.COOKIE_DOMAIN,
        });
        response.cookies.set(`${process.env.COOKIE_PREFIX}-authToken`, JSON.stringify(accessToken), {
          maxAge: calculateExpiry(accessTokenExpiry?.exp),
          domain: process.env.COOKIE_DOMAIN,
        });
        response.cookies.set(`${process.env.COOKIE_PREFIX}-userInfo`, JSON.stringify(userInfo), {
          maxAge: calculateExpiry(accessTokenExpiry?.exp),
          domain: process.env.COOKIE_DOMAIN,
        });
        response.headers.set(`${process.env.COOKIE_PREFIX}-refreshToken`, JSON.stringify(refreshToken));
        response.headers.set(`${process.env.COOKIE_PREFIX}-authToken`, JSON.stringify(accessToken));
        response.headers.set(`${process.env.COOKIE_PREFIX}-userInfo`, JSON.stringify(userInfo));
        response.headers.set(`${process.env.COOKIE_PREFIX}-isLoggedIn`, 'true');
        return response;
      }
    } else {
      return response;
    }
  } catch (err) {
    console.log(err);
    response.cookies.delete(`${process.env.COOKIE_PREFIX}-refreshToken`);
    response.cookies.delete(`${process.env.COOKIE_PREFIX}-authToken`);
    response.cookies.delete(`${process.env.COOKIE_PREFIX}-userInfo`);
    return response;
  }
}
