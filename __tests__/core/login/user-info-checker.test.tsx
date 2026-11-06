import React from 'react';
import { render, waitFor } from '@testing-library/react';
import Cookies from 'js-cookie';

import { UserInfoChecker, compactRbac } from '@/components/core/login/components/UserInfoChecker';
import { useCurrentUserStore } from '@/services/auth/store';

const mockRouter = { refresh: jest.fn(), push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() };
jest.mock('next/navigation', () => ({ useRouter: () => mockRouter }));
jest.mock('posthog-js/react', () => ({ usePostHog: () => ({ reset: jest.fn() }) }));

let mockMemberInfo: Record<string, unknown> | undefined;
jest.mock('@/services/members/hooks/useMember', () => ({
  useMember: () => ({ data: mockMemberInfo ? { memberInfo: mockMemberInfo } : undefined }),
}));

const UID = 'member-1';
const cookieUser = {
  uid: UID,
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  roles: ['DIRECTORYADMIN'],
  leadingTeams: [],
  profileImageUrl: 'https://img/ada.png',
};

// What GET /v1/members/{uid} returns for a member with many permissions: every
// entry carries a name and a description, which is what overflowed the cookie.
const permission = (n: number) => ({
  uid: `perm-uid-${n}`,
  code: `scope_${n}.read`,
  description: `Lets the member read everything in scope ${n}, including the parts only admins usually see.`,
});
const fullRbac = {
  status: 'APPROVED',
  policies: [{ uid: 'p1', code: 'pl_internal', name: 'PL internal', description: null, role: 'admin', group: 'pl' }],
  effectivePermissions: Array.from({ length: 60 }, (_, n) => permission(n)),
  roles: [{ uid: 'r1', code: 'admin', name: 'Admin', description: 'Directory administrator' }],
};
const member = (rbac: unknown) => ({
  uid: UID,
  name: cookieUser.name,
  imageUrl: cookieUser.profileImageUrl,
  memberRoles: [{ name: 'DIRECTORYADMIN' }],
  teamMemberRoles: [],
  rbac,
});

const readCookie = () => JSON.parse(Cookies.get('userInfo') as string);

beforeEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  Cookies.remove('userInfo');
  useCurrentUserStore.setState({ currentUser: null, isEnrichedByApi: false } as any);
});

describe('compactRbac', () => {
  it('keeps the status and the codes only', () => {
    expect(compactRbac(fullRbac)).toEqual({
      status: 'APPROVED',
      policies: [{ code: 'pl_internal' }],
      effectivePermissions: fullRbac.effectivePermissions.map(({ code }) => ({ code })),
      roles: [{ code: 'admin' }],
    });
  });

  it('stores missing lists as empty ones', () => {
    expect(compactRbac({ status: 'PENDING' })).toEqual({
      status: 'PENDING',
      policies: [],
      effectivePermissions: [],
      roles: [],
    });
  });
});

describe('UserInfoChecker (LAB-2956)', () => {
  it('fills the cookie with the compact rbac and refreshes once', async () => {
    Cookies.set('userInfo', JSON.stringify(cookieUser));
    mockMemberInfo = member(fullRbac);

    render(<UserInfoChecker uid={UID} />);

    await waitFor(() => expect(mockRouter.refresh).toHaveBeenCalledTimes(1));
    const stored = readCookie();
    expect(stored.rbac).toEqual(compactRbac(fullRbac));
    expect(Cookies.get('userInfo')).not.toContain('description');
    // The full API rbac would not have fit; the compact one does.
    expect(encodeURIComponent(JSON.stringify({ ...cookieUser, rbac: fullRbac })).length).toBeGreaterThan(4096);
    expect(encodeURIComponent(Cookies.get('userInfo') as string).length).toBeLessThan(4096);
    expect(useCurrentUserStore.getState().currentUser?.rbac?.status).toBe('APPROVED');
  });

  it('does not refresh when the browser drops the cookie write', async () => {
    Cookies.set('userInfo', JSON.stringify(cookieUser));
    // From here on the browser refuses every write, as it does for a cookie
    // over the size cap: the refresh can't pick the change up, and on a 404
    // page it would reload the page forever.
    jest.spyOn(Document.prototype, 'cookie', 'set').mockImplementation(() => undefined);
    mockMemberInfo = member(fullRbac);

    render(<UserInfoChecker uid={UID} />);

    // The client store still gets the API's answer.
    await waitFor(() => expect(useCurrentUserStore.getState().currentUser?.rbac?.status).toBe('APPROVED'));
    expect(readCookie().rbac).toBeUndefined();
    expect(mockRouter.refresh).not.toHaveBeenCalled();
  });

  it('leaves a matching cookie alone when the API sends no permission list', async () => {
    // compactRbac stored [] for the missing list; a missing list must count as equal.
    Cookies.set('userInfo', JSON.stringify({ ...cookieUser, rbac: compactRbac({ status: 'APPROVED' }) }));
    const before = Cookies.get('userInfo');
    mockMemberInfo = member({ status: 'APPROVED' });
    const setSpy = jest.spyOn(Cookies, 'set');

    render(<UserInfoChecker uid={UID} />);

    // Give the effect its turn: the member data is there on the first render.
    await waitFor(() => expect(Cookies.get('userInfo')).toBe(before));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(setSpy).not.toHaveBeenCalled();
    expect(mockRouter.refresh).not.toHaveBeenCalled();
  });
});
