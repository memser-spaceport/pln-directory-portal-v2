import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const APP_ID = /^[a-z0-9][a-z0-9-]*$/;
const STATE = /^[A-Za-z0-9_-]{43}$/;
const RELATIVE_PATH_PROBE_BASE = 'https://placeholder.invalid';

/** A same-origin path (`/x?y`) to return to inside the app, or `/`. */
function safeReturnPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u001f]/.test(value)) return '/';
  try {
    const url = new URL(value, RELATIVE_PATH_PROBE_BASE);
    return url.origin === new URL(RELATIVE_PATH_PROBE_BASE).origin ? `${url.pathname}${url.search}` : '/';
  } catch {
    return '/';
  }
}

/** The callback origin web-api computed must be an https host under COOKIE_DOMAIN, where AI Apps are served. */
function isAppOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    const domain = (process.env.COOKIE_DOMAIN || '').trim().replace(/^\./, '').toLowerCase();
    return url.protocol === 'https:' && url.pathname === '/' && (!domain || url.hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

const noStore = (response: NextResponse) => {
  response.headers.set('cache-control', 'no-store');
  return response;
};

/**
 * Sign-in round trip for a deployed AI App's auth gate (LAB-2695). The gate sends a signed-out visitor here; this
 * route (protected by proxy.ts, so a signed-out member logs in first and lands back here) mints a one-time code
 * with the member's LabOS token and returns them to the app's `/_pln/callback`, which turns it into an app session.
 * Any failure lands on the AI Apps page instead of back at the app, so it can never loop.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const appId = params.get('appId') ?? '';
  const target = params.get('target') === 'dev' ? 'dev' : 'prod';
  const state = params.get('state') ?? '';
  const fallback = noStore(NextResponse.redirect(new URL('/pl-infra/ai-apps', request.url)));

  if (
    !APP_ID.test(appId) ||
    !STATE.test(state) ||
    (params.get('target') && !['prod', 'dev'].includes(params.get('target')!))
  ) {
    return fallback;
  }

  const token = (await cookies()).get('authToken')?.value?.replace(/"/g, '');
  if (!token) {
    const backlink = encodeURIComponent(`${request.nextUrl.pathname}${request.nextUrl.search}`);
    return noStore(NextResponse.redirect(new URL(`/members?backlink=${backlink}#login`, request.url)));
  }

  try {
    const res = await fetch(`${process.env.DIRECTORY_API_URL}/v1/ai-apps/sessions/code`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId, target }),
      cache: 'no-store',
    });
    if (!res.ok) return fallback;
    const { code, callbackOrigin } = (await res.json()) as { code?: string; callbackOrigin?: string };
    if (!code || !callbackOrigin || !isAppOrigin(`${callbackOrigin}/`)) return fallback;

    const callback = new URL('/_pln/callback', callbackOrigin);
    callback.searchParams.set('code', code);
    callback.searchParams.set('state', state);
    callback.searchParams.set('return', safeReturnPath(params.get('return')));
    return noStore(NextResponse.redirect(callback));
  } catch {
    return fallback;
  }
}
