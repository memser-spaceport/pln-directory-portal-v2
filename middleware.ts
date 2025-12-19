import { NextRequest, NextResponse } from 'next/server';
import { checkIsValidToken, renewAccessToken } from './services/auth.service';
import { calculateExpiry, decodeToken } from './utils/auth.utils';

/**
 * Protected routes that require authentication
 * Users accessing these routes without authentication will be redirected to login
 */
const PROTECTED_ROUTES = ['/alignment-assets'];

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
    '/alignment-assets/:path',
  ],
};

/**
 * Checks if the given pathname matches any protected route
 * @param pathname - The request pathname to check
 * @returns true if the route is protected, false otherwise
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Creates a redirect response to the members page with login trigger
 * @param req - The incoming request
 * @param pathname - The original pathname to redirect back to after login
 * @returns NextResponse redirect to /members with backlink and #login hash
 */
function createLoginRedirect(req: NextRequest, pathname: string): NextResponse {
  console.log('createLoginRedirect pathname', pathname);
  const backlink = encodeURIComponent(pathname);
  const redirectUrl = new URL(`/members?backlink=${backlink}#login`, req.url);
  return NextResponse.redirect(redirectUrl);
}

export async function middleware(req: NextRequest) {
  const response = NextResponse.next();
  const refreshTokenFromCookie = req?.cookies?.get('refreshToken');
  const authTokenFromCookie = req?.cookies?.get('authToken');
  const userInfo = req?.cookies?.get('userInfo');
  const pathname = req.nextUrl.pathname;
  console.log('middleware pathName', pathname);
  let isValidAuthToken = false;

  try {
    // Check if accessing a protected route without authentication
    if (!authTokenFromCookie && isProtectedRoute(pathname)) {
      console.log('middleware inside authTokenFromCookie', authTokenFromCookie);
      return createLoginRedirect(req, pathname);
    }

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
      if (validCheckResponse?.forceLogout) {
        response.cookies.delete('refreshToken');
        response.cookies.delete('authToken');
        response.cookies.delete('userInfo');

        // Redirect to login if accessing protected route after force logout
        if (isProtectedRoute(pathname)) {
          return createLoginRedirect(req, pathname);
        }
        return response;
      }

      // Priority 2: Check if token is active
      isValidAuthToken = (validCheckResponse && validCheckResponse?.active) || false;
      if (isValidAuthToken) {
        // console.log('middleware inside isValidAuthToken');
        response.headers.set('refreshToken', refreshTokenFromCookie?.value as string);
        response.headers.set('authToken', authTokenFromCookie?.value as string);
        response.headers.set('userInfo', encodeURIComponent(userInfo?.value as string));
        response.headers.set('isLoggedIn', 'true');
        return response;
      }
    }

    if ((!authTokenFromCookie || !isValidAuthToken || !userInfo) && refreshTokenFromCookie) {
      // console.log('middleware inside refresh token');
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
        response.headers.set('userInfo', encodeURIComponent(JSON.stringify(userInfo)));
        response.headers.set('isLoggedIn', 'true');
        return response;
      }
    } else {
      response.cookies.delete('refreshToken');
      response.cookies.delete('authToken');
      response.cookies.delete('userInfo');

      // Redirect to login if accessing protected route with invalid tokens
      if (isProtectedRoute(pathname)) {
        return createLoginRedirect(req, pathname);
      }
      return response;
    }
  } catch (err) {
    console.error(err);
    response.cookies.delete('refreshToken');
    response.cookies.delete('authToken');
    response.cookies.delete('userInfo');

    // Redirect to login if accessing protected route and an error occurred
    if (isProtectedRoute(pathname)) {
      return createLoginRedirect(req, pathname);
    }
    return response;
  }
}
