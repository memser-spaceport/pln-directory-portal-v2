import { NextRequest, NextResponse } from 'next/server';
import { checkIsValidToken, renewAccessToken } from './services/auth.service';
import { calculateExpiry, decodeToken } from './utils/auth.utils';
import { isAiAppsRoute, isProtectedRoute } from './utils/isProtectedRoute';
import {
  clearSessionCookies,
  expireSharedCookies,
  hostOnlySessionCookies,
  SESSION_SCOPE_COOKIE,
  sessionScopeValue,
  shareAuthTokenWithApps,
} from './utils/sessionCookies';

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
 * One-time move of an existing session's refreshToken/userInfo from the shared COOKIE_DOMAIN to LabOS's own host, so
 * deployed AI Apps stop receiving them. Runs on the valid-session path until the host-only marker is set; a malformed
 * token only skips the move (it must never end the session).
 */
function migrateSessionCookiesToHost(req: NextRequest, response: NextResponse, authToken: string) {
  const scope = sessionScopeValue();
  if (req.cookies.get(SESSION_SCOPE_COOKIE)?.value === scope) return;
  const refreshToken = req.cookies.get('refreshToken')?.value;
  const userInfo = req.cookies.get('userInfo')?.value;
  const authTokenCookie = req.cookies.get('authToken')?.value;
  if (!refreshToken || !userInfo) return;
  try {
    const refreshExpiry = calculateExpiry((decodeToken(refreshToken.replace(/"/g, '')) as any)?.exp);
    const accessExpiry = calculateExpiry((decodeToken(authToken) as any)?.exp);
    if (!(refreshExpiry > 0) || !(accessExpiry > 0)) return;
    response.cookies.set('refreshToken', refreshToken, { maxAge: refreshExpiry, path: '/' });
    response.cookies.set('userInfo', userInfo, { maxAge: accessExpiry, path: '/' });
    if (!shareAuthTokenWithApps() && authTokenCookie) {
      response.cookies.set('authToken', authTokenCookie, { maxAge: accessExpiry, path: '/' });
    }
    response.cookies.set(SESSION_SCOPE_COOKIE, scope, { maxAge: refreshExpiry, path: '/' });
    expireSharedCookies(response, hostOnlySessionCookies());
  } catch (err) {
    console.error('Session cookie migration skipped', err);
  }
}

const LEGACY_DEEP_LINK_ROUTES = [/^\/pl-infra-os$/, /^\/pl-infra\/ai-apps\/[^/]+$/];
const RELATIVE_PATH_PROBE_BASE = 'https://placeholder.invalid';

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

  const response = NextResponse.next();
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
      clearSessionCookies(response);
      return response;
    }

    const authToken = authTokenFromCookie?.value.replace(/"/g, '');
    if (authToken) {
      const validCheckResponse = await checkIsValidToken(authToken as string);

      // Priority 1: Check for force logout (regardless of active status)
      if (validCheckResponse?.forceLogout) {
        clearSessionCookies(response);

        // Redirect to login if accessing protected route after force logout
        if (isProtectedRoute(pathname)) {
          return createLoginRedirect(req, pathname);
        }
        return response;
      }

      // Priority 2: Check if token is active
      isValidAuthToken = (validCheckResponse && validCheckResponse?.active) || false;
      if (isValidAuthToken && userInfo?.value) {
        // Only set logged in if we have valid userInfo
        response.headers.set('refreshToken', refreshTokenFromCookie?.value as string);
        response.headers.set('authToken', authTokenFromCookie?.value as string);
        response.headers.set('userInfo', encodeURIComponent(userInfo.value));
        response.headers.set('isLoggedIn', 'true');
        migrateSessionCookiesToHost(req, response, authToken);
        return response;
      }
    }

    if ((!authTokenFromCookie || !isValidAuthToken || !userInfo) && refreshTokenFromCookie) {
      // console.log('middleware inside refresh token');
      const renewAccessTokenResponse = await renewAccessToken(refreshTokenFromCookie?.value.replace(/"/g, ''));
      const { accessToken, refreshToken, userInfo } = renewAccessTokenResponse?.data;

      const accessTokenExpiry = decodeToken(accessToken) as any;
      const refreshTokenExpiry = decodeToken(refreshToken) as any;
      if (accessToken && refreshToken && userInfo && userInfo.uid) {
        // Only set logged in if userInfo has a valid uid
        // refreshToken/userInfo stay on LabOS's own host; authToken is shared with AI Apps while the switch is on.
        response.cookies.set('refreshToken', JSON.stringify(refreshToken), {
          maxAge: calculateExpiry(refreshTokenExpiry?.exp),
          path: '/',
        });
        response.cookies.set('authToken', JSON.stringify(accessToken), {
          maxAge: calculateExpiry(accessTokenExpiry?.exp),
          // Shared with AI Apps until every app's auth gate issues its own sessions (AI_APPS_SHARE_AUTH_TOKEN).
          ...(shareAuthTokenWithApps() ? { domain: process.env.COOKIE_DOMAIN } : { path: '/' }),
        });
        response.cookies.set('userInfo', JSON.stringify(userInfo), {
          maxAge: calculateExpiry(accessTokenExpiry?.exp),
          path: '/',
        });
        response.cookies.set(SESSION_SCOPE_COOKIE, sessionScopeValue(), {
          maxAge: calculateExpiry(refreshTokenExpiry?.exp),
          path: '/',
        });
        expireSharedCookies(response, hostOnlySessionCookies());
        response.headers.set('refreshToken', JSON.stringify(refreshToken));
        response.headers.set('authToken', JSON.stringify(accessToken));
        response.headers.set('userInfo', encodeURIComponent(JSON.stringify(userInfo)));
        response.headers.set('isLoggedIn', 'true');
        return response;
      }
    } else {
      clearSessionCookies(response);

      // Redirect to login if accessing protected route with invalid tokens
      if (isProtectedRoute(pathname)) {
        return createLoginRedirect(req, pathname);
      }
      return response;
    }
  } catch (err) {
    console.error(err);
    clearSessionCookies(response);

    // Redirect to login if accessing protected route and an error occurred
    if (isProtectedRoute(pathname)) {
      return createLoginRedirect(req, pathname);
    }
    return response;
  }
}
