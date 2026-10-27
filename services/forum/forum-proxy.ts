import type { IUserInfo } from '@/types/shared.types';
import { isAdminUser } from '@/utils/user/isAdminUser';

const IMPERSONATE_UID = /^[A-Za-z0-9_-]{1,128}$/;

const ALLOWED: { method: string; pattern: RegExp }[] = [
  { method: 'GET', pattern: /^\/api\/recent$/ },
  { method: 'GET', pattern: /^\/api\/categories$/ },
  { method: 'GET', pattern: /^\/api\/topic\/\d+$/ },
  { method: 'GET', pattern: /^\/api\/v3\/categories\/\d+\/topics$/ },
  { method: 'POST', pattern: /^\/api\/v3\/topics$/ },
  { method: 'POST', pattern: /^\/api\/v3\/topics\/\d+$/ },
  { method: 'PUT', pattern: /^\/api\/v3\/posts\/\d+$/ },
  { method: 'PUT', pattern: /^\/api\/v3\/posts\/\d+\/vote$/ },
  { method: 'DELETE', pattern: /^\/api\/v3\/posts\/\d+\/vote$/ },
];

export function forumProxyPath(segments: string[]): string | null {
  if (segments.length === 0) return null;
  if (
    segments.some(
      (segment) =>
        segment === '' ||
        segment === '.' ||
        segment === '..' ||
        segment.includes('/') ||
        segment.includes('\\') ||
        segment.includes('%'),
    )
  ) {
    return null;
  }
  return `/${segments.join('/')}`;
}

export function isForumProxyAllowed(method: string, path: string): boolean {
  return ALLOWED.some((rule) => rule.method === method && rule.pattern.test(path));
}

/**
 * The NodeBB bearer is the forum token when the server has one, otherwise the
 * member session token. The impersonation header is added only for a directory
 * admin, and only for a uid that is not that admin's own.
 */
export function userInfoForImpersonation(memberUid: string, effectivePermissions: string[]): IUserInfo {
  return {
    uid: memberUid,
    rbac: {
      status: 'APPROVED',
      policies: [],
      roles: [],
      effectivePermissions: effectivePermissions.map((code) => ({ code })),
    },
  };
}

export function buildForumUpstreamHeaders(input: {
  forumToken?: string;
  memberToken?: string;
  userInfo: IUserInfo | null;
  impersonateMemberUid: string | null;
}): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const bearer = input.forumToken?.trim() || input.memberToken?.trim();
  if (bearer) headers.Authorization = `Bearer ${bearer}`;

  const requested = input.impersonateMemberUid?.trim() ?? '';
  const permissions = input.userInfo?.rbac?.effectivePermissions;
  if (
    IMPERSONATE_UID.test(requested) &&
    requested !== input.userInfo?.uid &&
    Array.isArray(permissions) &&
    isAdminUser(input.userInfo)
  ) {
    headers['x-impersonate-member-uid'] = requested;
  }

  return headers;
}
