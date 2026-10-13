import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const STATE = /^[A-Za-z0-9_-]{20,100}$/;

/** A first-party app's callback: https on a host under COOKIE_DOMAIN (http is allowed only for localhost). */
function callbackUrl(value: string | null): URL | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const domain = (process.env.COOKIE_DOMAIN || '').trim().replace(/^\./, '').toLowerCase();
    if (!domain) return null;
    const underDomain = url.hostname === domain || url.hostname.endsWith(`.${domain}`);
    const secure = url.protocol === 'https:' || (domain === 'localhost' && url.protocol === 'http:');
    return underDomain && secure && !url.username && !url.password ? url : null;
  } catch {
    return null;
  }
}

const noStore = (response: NextResponse) => {
  response.headers.set('cache-control', 'no-store');
  return response;
};

/**
 * Sign-in for first-party apps on other hosts (the ATS), which no longer receive `authToken` (LAB-2695). proxy.ts
 * renews a stale token before this runs; a signed-out member logs in and lands back here. The member's token stays
 * here: the app gets a one-time code that only its server can redeem, with its integration key.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const callback = callbackUrl(params.get('redirect_uri'));
  const state = params.get('state') ?? '';
  if (!callback || !STATE.test(state)) {
    return noStore(NextResponse.redirect(new URL('/', request.url)));
  }

  const backlink = encodeURIComponent(`${request.nextUrl.pathname}${request.nextUrl.search}`);
  const login = () => noStore(NextResponse.redirect(new URL(`/members?backlink=${backlink}#login`, request.url)));
  const token = (await cookies()).get('authToken')?.value?.replace(/"/g, '');
  if (!token) return login();

  callback.searchParams.set('state', state);
  try {
    const res = await fetch(`${process.env.DIRECTORY_API_URL}/v1/member-sign-in/codes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: '{}',
      cache: 'no-store',
    });
    if (res.status === 401) return login();
    const { code } = res.ok ? ((await res.json()) as { code?: string }) : {};
    if (code) callback.searchParams.set('code', code);
    else callback.searchParams.set('error', 'sign_in_failed');
  } catch {
    callback.searchParams.set('error', 'sign_in_failed');
  }
  return noStore(NextResponse.redirect(callback));
}
