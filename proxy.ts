import { NextRequest, NextResponse } from 'next/server';
import { checkIsValidToken, renewAccessToken } from './services/auth.service';
import { calculateExpiry, decodeToken } from './utils/auth.utils';
import { isAiAppsRoute, isProtectedRoute } from './utils/isProtectedRoute';
import { clearSessionCookies, SESSION_SCOPE_COOKIE, sessionScopeValue } from './utils/sessionCookies';
import { setSessionCookies } from './utils/sessionResponse';

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
    '/alignment-asset/:path',
    '/investors',
    '/investors/:path',
  ],
};

/**
 * Creates a redirect response to the members page with login trigger
 * @param req - The incoming request
 * @param pathname - The original pathname to redirect back to after login
 * @returns NextResponse redirect to /members with backlink and #login hash
 */
function createLoginRedirect(req: NextRequest, pathname: string): NextResponse {
  // AI App links carry `?settings=deployment`, so keep the query for them.
  const target = isAiAppsRoute(pathname) ? `${pathname}${req.nextUrl.search}` : pathname;
  const backlink = encodeURIComponent(target);
  const redirectUrl = new URL(`/members?backlink=${backlink}#login`, req.url);
  return NextResponse.redirect(redirectUrl);
}

/**
 * One-time rewrite of an existing session's cookies into the current layout (see sessionScopeValue): refreshToken
 * httpOnly and host-only, every cookie with Secure/SameSite, plus the session marker. Runs on the valid-session path
 * until the migration marker matches; a malformed token only skips the rewrite (it must never end the session).
 */
function migrateSessionCookies(req: NextRequest, response: NextResponse, authToken: string) {
  if (req.cookies.get(SESSION_SCOPE_COOKIE)?.value === sessionScopeValue()) return;
  const refreshToken = req.cookies.get('refreshToken')?.value?.replace(/"/g, '');
  const userInfo = req.cookies.get('userInfo')?.value;
  if (!refreshToken || !userInfo) return;
  try {
    const refreshExpiry = calculateExpiry((decodeToken(refreshToken) as any)?.exp);
    const accessExpiry = calculateExpiry((decodeToken(authToken) as any)?.exp);
    if (!(refreshExpiry > 0) || !(accessExpiry > 0)) return;
    setSessionCookies(response, req, { accessToken: authToken, refreshToken, userInfo: JSON.parse(userInfo) });
  } catch (err) {
    console.error('Session cookie migration skipped', err);
  }
}

const AUTH_STATE_HEADERS = ['authToken', 'refreshToken', 'userInfo', 'isLoggedIn'] as const;

const LEGACY_DEEP_LINK_ROUTES = [/^\/pl-infra-os$/, /^\/pl-infra\/ai-apps\/[^/]+$/];
const RELATIVE_PATH_PROBE_BASE = 'https://placeholder.invalid';

// Server Components read the request. A response header would reach the browser.
// A client can send these names, so drop that copy before this proxy sets its own.
function pageRequestHeaders(req: NextRequest): Headers {
  const headers = new Headers(req.headers);
  for (const name of AUTH_STATE_HEADERS) headers.delete(name);
  return headers;
}

function setSignedInRequestHeaders(
  headers: Headers,
  session: { authToken: string; refreshToken: string; userInfo: string },
) {
  headers.set('authToken', session.authToken);
  headers.set('refreshToken', session.refreshToken);
  headers.set('userInfo', session.userInfo);
  headers.set('isLoggedIn', 'true');
}

function nextPage(requestHeaders: Headers): NextResponse {
  return NextResponse.next({ request: { headers: requestHeaders } });
}

// AI App deep links used to carry the open subpage as `?path=`; those links
// are still shared and bookmarked, so send them to the segment form
// (`/pl-infra-os/flywheels`), keeping every other param (e.g. `settings`).
// Only a same-origin pathname is accepted; anything else lands on the app root.
function legacyDeepLinkRedirect(req: NextRequest): NextResponse | null {
  const { pathname, searchParams } = req.nextUrl;
  if (!searchParams.has('path') || !LEGACY_DEEP_LINK_ROUTES.some((route) => route.test(pathname))) return null;
  const target = req.nextUrl.clone();
  target.searchParams.delete('path');
  try {
    const probe = new URL(searchParams.get('path') ?? '', RELATIVE_PATH_PROBE_BASE);
    if (probe.hostname === new URL(RELATIVE_PATH_PROBE_BASE).hostname) {
      target.pathname = `${pathname}${probe.pathname.replace(/\/$/, '')}`;
    }
  } catch {
    // not a parsable path — fall through to the bare app route
  }
  return NextResponse.redirect(target, 308);
}

export async function proxy(req: NextRequest) {
  const legacyRedirect = legacyDeepLinkRedirect(req);
  if (legacyRedirect) return legacyRedirect;

  const requestHeaders = pageRequestHeaders(req);
  const refreshTokenFromCookie = req?.cookies?.get('refreshToken');
  const authTokenFromCookie = req?.cookies?.get('authToken');
  const userInfo = req?.cookies?.get('userInfo');
  const pathname = req.nextUrl.pathname;
  let isValidAuthToken = false;

  try {
    // Check if accessing a protected route without authentication
    if (!authTokenFromCookie && isProtectedRoute(pathname)) {
      return createLoginRedirect(req, pathname);
    }

    if (!refreshTokenFromCookie) {
      const response = nextPage(requestHeaders);
      clearSessionCookies(response);
      return response;
    }

    const authToken = authTokenFromCookie?.value.replace(/"/g, '');
    if (authToken) {
      const validCheckResponse = await checkIsValidToken(authToken as string);

      // Priority 1: Check for force logout (regardless of active status)
      if (validCheckResponse?.forceLogout) {
        // Redirect to login if accessing protected route after force logout
        if (isProtectedRoute(pathname)) {
          return createLoginRedirect(req, pathname);
        }
        const response = nextPage(requestHeaders);
        clearSessionCookies(response);
        return response;
      }

      // Priority 2: Check if token is active
      isValidAuthToken = (validCheckResponse && validCheckResponse?.active) || false;
      if (isValidAuthToken && userInfo?.value) {
        // Only set logged in if we have valid userInfo
        setSignedInRequestHeaders(requestHeaders, {
          refreshToken: refreshTokenFromCookie.value,
          authToken: authTokenFromCookie?.value as string,
          userInfo: encodeURIComponent(userInfo.value),
        });
        const response = nextPage(requestHeaders);
        migrateSessionCookies(req, response, authToken);
        return response;
      }
    }

    if ((!authTokenFromCookie || !isValidAuthToken || !userInfo) && refreshTokenFromCookie) {
      // console.log('middleware inside refresh token');
      const renewAccessTokenResponse = await renewAccessToken(refreshTokenFromCookie?.value.replace(/"/g, ''));
      const { accessToken, refreshToken, userInfo } = renewAccessTokenResponse?.data;

      if (accessToken && refreshToken && userInfo && userInfo.uid) {
        // Only set logged in if userInfo has a valid uid
        setSignedInRequestHeaders(requestHeaders, {
          refreshToken: JSON.stringify(refreshToken),
          authToken: JSON.stringify(accessToken),
          userInfo: encodeURIComponent(JSON.stringify(userInfo)),
        });
        const response = nextPage(requestHeaders);
        setSessionCookies(response, req, { accessToken, refreshToken, userInfo });
        return response;
      }
    } else {
      // Redirect to login if accessing protected route with invalid tokens
      if (isProtectedRoute(pathname)) {
        return createLoginRedirect(req, pathname);
      }
      const response = nextPage(requestHeaders);
      clearSessionCookies(response);
      return response;
    }
  } catch (err) {
    console.error(err);
    // Redirect to login if accessing protected route and an error occurred
    if (isProtectedRoute(pathname)) {
      return createLoginRedirect(req, pathname);
    }
    const response = nextPage(requestHeaders);
    clearSessionCookies(response);
    return response;
  }
}
