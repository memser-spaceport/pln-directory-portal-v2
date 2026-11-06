import { NextRequest, NextResponse } from 'next/server';
import { renewAccessToken } from '@/services/auth.service';
import { clearSessionCookies } from '@/utils/sessionCookies';
import { isSameOriginRequest, setSessionCookies } from '@/utils/sessionResponse';

function sessionEnded() {
  const response = NextResponse.json({ error: 'Session expired' }, { status: 401 });
  clearSessionCookies(response);
  return response;
}

/**
 * Renews the session from the httpOnly refresh token. The browser gets the new access token and user info; the
 * rotated refresh token only goes back into its httpOnly cookie. A failed renewal ends the session.
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
    if (!renewed?.ok || !accessToken || !refreshToken || !userInfo?.uid) {
      return sessionEnded();
    }

    const response = NextResponse.json({ accessToken, userInfo });
    setSessionCookies(response, req, { accessToken, refreshToken, userInfo });
    return response;
  } catch (err) {
    console.error('Session refresh failed', err);
    return sessionEnded();
  }
}
