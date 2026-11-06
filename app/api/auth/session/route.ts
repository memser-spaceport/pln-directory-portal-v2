import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkIsValidToken } from '@/services/auth.service';
import { decodeToken } from '@/utils/auth.utils';
import { isSameOriginRequest, setSessionCookies } from '@/utils/sessionResponse';

const SessionHandOffSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  userInfo: z.object({ uid: z.string().min(1) }).passthrough(),
});

const hasLiveExpiry = (token: string) => {
  const exp = (decodeToken(token) as any)?.exp;
  return typeof exp === 'number' && exp > Date.now() / 1000;
};

/**
 * Starts a LabOS session from the tokens the API just issued to the browser (sign-in, invite login, email change).
 * The server sets the cookies, so `refreshToken` lands httpOnly and is never stored where page scripts can read it.
 */
export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const parsed = SessionHandOffSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
  }
  const { accessToken, refreshToken, userInfo } = parsed.data;

  try {
    if (!hasLiveExpiry(accessToken) || !hasLiveExpiry(refreshToken)) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
    }
    const introspection = await checkIsValidToken(accessToken);
    if (!introspection?.active || introspection?.forceLogout) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
    }

    const response = new NextResponse(null, { status: 204 });
    setSessionCookies(response, req, { accessToken, refreshToken, userInfo });
    return response;
  } catch (err) {
    console.error('Session hand-off failed', err);
    return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
  }
}
