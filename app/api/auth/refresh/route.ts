import { NextRequest, NextResponse } from 'next/server';
import { isTransientRefreshFailure, renewAccessToken } from '@/services/auth.service';
import { clearSessionCookies } from '@/utils/sessionCookies';
import { isSameOriginRequest, setSessionCookies } from '@/utils/sessionResponse';

function sessionEnded() {
  const response = NextResponse.json({ error: 'Session expired' }, { status: 401 });
  clearSessionCookies(response);
  return response;
}

function authUnavailable() {
  return NextResponse.json({ error: 'Authentication service unavailable' }, { status: 503 });
}

/**
 * Renews the session from the httpOnly refresh token. The browser gets the new access token and user info; the
 * rotated refresh token only goes back into its httpOnly cookie. A rejected token ends the session. An outage does not.
 */
export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const refreshTokenCookie = req.cookies.get('refreshToken')?.value?.replace(/"/g, '');
  if (!refreshTokenCookie) {
    return sessionEnded();
  }

  try {
    const renewed = await renewAccessToken(refreshTokenCookie);
    const { accessToken, refreshToken, userInfo } = renewed?.data ?? {};
    if (isTransientRefreshFailure(renewed)) {
      return authUnavailable();
    }
    if (!renewed?.ok || !accessToken || !refreshToken || !userInfo?.uid) {
      return sessionEnded();
    }

    const response = NextResponse.json({ accessToken, userInfo });
    setSessionCookies(response, req, { accessToken, refreshToken, userInfo });
    return response;
  } catch (err) {
    console.error('Session refresh failed', err);
    return authUnavailable();
  }
}
