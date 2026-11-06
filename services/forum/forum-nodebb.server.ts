import 'server-only';

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { renewAccessToken } from '@/services/auth.service';
import {
  buildForumUpstreamHeaders,
  forumProxyPath,
  isForumProxyAllowed,
  userInfoForImpersonation,
} from '@/services/forum/forum-proxy';
import type { IUserInfo } from '@/types/shared.types';
import { calculateExpiry, decodeToken } from '@/utils/auth.utils';
import { getParsedValue } from '@/utils/common.utils';
import {
  expireSharedCookies,
  hostOnlySessionCookies,
  SESSION_SCOPE_COOKIE,
  sessionScopeValue,
  shareAuthTokenWithApps,
} from '@/utils/sessionCookies';

type Session = {
  authToken: string;
  refreshToken: string;
  userInfo: IUserInfo | null;
};

type RenewedSession = {
  accessToken: string;
  refreshToken: string;
  userInfo: IUserInfo;
};

type CookieJar = {
  get(name: string): { value: string } | undefined;
};

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function readSession(jar: CookieJar): Session {
  const parsedUser = getParsedValue(jar.get('userInfo')?.value);
  return {
    authToken: asString(getParsedValue(jar.get('authToken')?.value)),
    refreshToken: asString(getParsedValue(jar.get('refreshToken')?.value)),
    userInfo: parsedUser && typeof parsedUser === 'object' ? (parsedUser as IUserInfo) : null,
  };
}

function configuredForumToken(signedIn: boolean): string | undefined {
  if (!signedIn) return undefined;
  const token = process.env.CUSTOM_FORUM_AUTH_TOKEN?.trim();
  return token || undefined;
}

async function renewSession(refreshToken: string): Promise<RenewedSession | null> {
  const result = await renewAccessToken(refreshToken);
  const data = result?.data;
  if (!result?.ok || !data?.accessToken || !data?.refreshToken || !data?.userInfo?.uid) return null;
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    userInfo: data.userInfo as IUserInfo,
  };
}

function applyRenewedSession(response: NextResponse, tokens: RenewedSession) {
  const accessTokenExpiry = decodeToken(tokens.accessToken) as { exp?: number } | null;
  const refreshTokenExpiry = decodeToken(tokens.refreshToken) as { exp?: number } | null;
  if (typeof accessTokenExpiry?.exp !== 'number' || typeof refreshTokenExpiry?.exp !== 'number') return;

  response.cookies.set('refreshToken', JSON.stringify(tokens.refreshToken), {
    maxAge: calculateExpiry(refreshTokenExpiry.exp),
    path: '/',
  });
  response.cookies.set('authToken', JSON.stringify(tokens.accessToken), {
    maxAge: calculateExpiry(accessTokenExpiry.exp),
    ...(shareAuthTokenWithApps() ? { domain: process.env.COOKIE_DOMAIN } : { path: '/' }),
  });
  response.cookies.set('userInfo', JSON.stringify(tokens.userInfo), {
    maxAge: calculateExpiry(accessTokenExpiry.exp),
    path: '/',
  });
  response.cookies.set(SESSION_SCOPE_COOKIE, sessionScopeValue(), {
    maxAge: calculateExpiry(refreshTokenExpiry.exp),
    path: '/',
  });
  expireSharedCookies(response, hostOnlySessionCookies());
}

async function callNodebb(input: {
  method: string;
  path: string;
  search: string;
  body?: string;
  impersonateMemberUid: string | null;
  forumToken?: string;
  memberToken?: string;
  userInfo: IUserInfo | null;
}): Promise<Response> {
  if (!isForumProxyAllowed(input.method, input.path)) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const base = process.env.FORUM_API_URL?.replace(/\/$/, '');
  if (!base) return Response.json({ error: 'Forum is not configured' }, { status: 500 });

  const write = input.method !== 'GET' && input.method !== 'HEAD';
  return fetch(`${base}${input.path}${input.search}`, {
    method: input.method,
    headers: buildForumUpstreamHeaders({
      forumToken: input.forumToken,
      memberToken: input.memberToken,
      userInfo: input.userInfo,
      impersonateMemberUid: input.impersonateMemberUid,
    }),
    body: write ? input.body : undefined,
    cache: 'no-store',
  });
}

async function fetchDirectoryAccess(
  authToken: string,
): Promise<{ memberUid: string; effectivePermissions: string[] } | null> {
  if (!authToken) return null;
  const base = process.env.DIRECTORY_API_URL?.replace(/\/$/, '');
  if (!base) return null;

  const response = await fetch(`${base}/v2/access-control-v2/me/access`, {
    headers: { Authorization: `Bearer ${authToken}` },
    cache: 'no-store',
  });
  if (response.status === 401) return null;
  if (!response.ok) return { memberUid: '', effectivePermissions: [] };

  const data = await response.json().catch(() => null);
  const permissions = Array.isArray(data?.effectivePermissions)
    ? data.effectivePermissions.filter((code: unknown): code is string => typeof code === 'string')
    : [];
  return { memberUid: typeof data?.memberUid === 'string' ? data.memberUid : '', effectivePermissions: permissions };
}

/** Admin is decided from the directory access of the session token, not from the userInfo cookie. */
async function impersonationActor(
  session: Session,
): Promise<{ userInfo: IUserInfo | null; renewed: RenewedSession | null }> {
  let token = session.authToken;
  let renewed: RenewedSession | null = null;
  if (!token && session.refreshToken) {
    renewed = await renewSession(session.refreshToken);
    token = renewed?.accessToken ?? '';
  }

  let access = token ? await fetchDirectoryAccess(token) : null;
  if (!access && session.refreshToken && !renewed) {
    const retry = await renewSession(session.refreshToken);
    if (retry) {
      renewed = retry;
      access = await fetchDirectoryAccess(retry.accessToken);
    }
  }

  if (!access?.memberUid) return { userInfo: null, renewed };
  return { userInfo: userInfoForImpersonation(access.memberUid, access.effectivePermissions), renewed };
}

async function sessionForUpstream(session: Session): Promise<{ session: Session; renewed: RenewedSession | null }> {
  const signedIn = Boolean(session.authToken || session.refreshToken);
  if (configuredForumToken(signedIn) || session.authToken || !session.refreshToken) {
    return { session, renewed: null };
  }

  const renewed = await renewSession(session.refreshToken);
  if (!renewed) return { session, renewed: null };
  return {
    session: { authToken: renewed.accessToken, refreshToken: renewed.refreshToken, userInfo: renewed.userInfo },
    renewed,
  };
}

export async function proxyForumRequest(request: NextRequest, segments: string[]): Promise<NextResponse> {
  const path = forumProxyPath(segments);
  if (!path || !isForumProxyAllowed(request.method, path)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const write = request.method !== 'GET' && request.method !== 'HEAD';
  let session = readSession(await cookies());
  const signedIn = Boolean(session.authToken || session.refreshToken);
  if (write && !signedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const prepared = await sessionForUpstream(session);
  session = prepared.session;

  const forumToken = configuredForumToken(Boolean(session.authToken || session.refreshToken));
  const memberToken = forumToken ? undefined : session.authToken;
  if (write && !forumToken && !memberToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const impersonateMemberUid = request.headers.get('x-impersonate-member-uid');
  let actor = session.userInfo;
  let renewed = prepared.renewed;
  if (impersonateMemberUid) {
    const decided = await impersonationActor(session);
    actor = decided.userInfo;
    if (decided.renewed) renewed = decided.renewed;
  }

  const body = write ? await request.text() : undefined;
  let upstream = await callNodebb({
    method: request.method,
    path,
    search: request.nextUrl.search,
    body,
    impersonateMemberUid,
    forumToken,
    memberToken,
    userInfo: actor,
  });

  if (!forumToken && upstream.status === 401 && session.refreshToken) {
    const retry = await renewSession(session.refreshToken);
    if (retry) {
      upstream = await callNodebb({
        method: request.method,
        path,
        search: request.nextUrl.search,
        body,
        impersonateMemberUid,
        memberToken: retry.accessToken,
        userInfo: actor,
      });
      renewed = retry;
    }
  }

  const response = new NextResponse(upstream.body, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
  });
  if (renewed) applyRenewedSession(response, renewed);
  return response;
}

export async function fetchForumTopic(topicId: string): Promise<Response> {
  const path = `/api/topic/${topicId}`;
  if (!isForumProxyAllowed('GET', path)) return Response.json({ error: 'Not found' }, { status: 404 });

  let session = readSession(await cookies());
  const prepared = await sessionForUpstream(session);
  session = prepared.session;
  const forumToken = configuredForumToken(Boolean(session.authToken || session.refreshToken));

  return callNodebb({
    method: 'GET',
    path,
    search: '',
    impersonateMemberUid: null,
    forumToken,
    memberToken: forumToken ? undefined : session.authToken,
    userInfo: session.userInfo,
  });
}
