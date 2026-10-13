import { knowsPermissions, unionViewerInfo } from '@/components/page/team-details/utils/viewerPermissions';
import type { IUserInfo } from '@/types/shared.types';

/**
 * The two places this app keeps a viewer's permissions, and why neither alone
 * is the answer.
 *
 * The `userInfo` cookie is what a server component can read; the current-user
 * store is hydrated from the API. They diverge both ways — and today the cookie
 * diverges in a way it cannot recover from, because the sync that repairs it
 * (`UserInfoChecker`) reads `GET /v1/members/{uid}`, which returns no `rbac` at
 * all. A directory admin is therefore invisible to any gate reading the cookie
 * alone, which is exactly how one ended up locked out of a page written for
 * leads *and admins*.
 */

const admin = (over: Partial<IUserInfo> = {}) =>
  ({
    uid: 'u1',
    leadingTeams: [],
    rbac: { effectivePermissions: [{ code: 'directory.admin.full' }] },
    ...over,
  }) as unknown as IUserInfo;

const cookie = (over: Partial<IUserInfo> = {}) => ({ uid: 'u1', leadingTeams: ['team-1'], ...over }) as IUserInfo;

describe('unionViewerInfo', () => {
  /* The case that prompted this: permissions live only in the store, and the
     lead memberships only in the cookie. Either alone loses something. */
  it('keeps the cookie’s teams and the store’s permissions', () => {
    const merged = unionViewerInfo(cookie(), admin());

    expect(merged?.leadingTeams).toEqual(['team-1']);
    expect(merged?.rbac?.effectivePermissions?.[0]?.code).toBe('directory.admin.full');
  });

  it('unions the teams from both, without repeating one', () => {
    const merged = unionViewerInfo(cookie({ leadingTeams: ['team-1', 'team-2'] }), admin({ leadingTeams: ['team-2'] }));

    expect(merged?.leadingTeams?.sort()).toEqual(['team-1', 'team-2']);
  });

  /**
   * An `rbac` object with no `effectivePermissions` is the uninformed shape, not
   * an empty answer — so it must not overwrite a source that actually has them.
   */
  it('does not let a permission-less rbac overwrite a real one', () => {
    const merged = unionViewerInfo(admin(), { uid: 'u1', rbac: {} } as unknown as IUserInfo);

    expect(merged?.rbac?.effectivePermissions?.[0]?.code).toBe('directory.admin.full');
  });

  it('copes with either side missing', () => {
    expect(unionViewerInfo(null, admin())?.rbac).toBeDefined();
    expect(unionViewerInfo(cookie(), null)?.leadingTeams).toEqual(['team-1']);
    expect(unionViewerInfo(null, null)).toBeNull();
  });
});

describe('knowsPermissions', () => {
  it('is true only when a record actually carries them', () => {
    expect(knowsPermissions(admin())).toBe(true);
    expect(knowsPermissions({ uid: 'u1', rbac: { effectivePermissions: [] } } as unknown as IUserInfo)).toBe(true);
  });

  /**
   * Silence is not a refusal. Every cookie in production is this shape today, so
   * a gate treating it as "no privileges" refuses everyone it was written for.
   */
  it('is false for a record that says nothing about them', () => {
    expect(knowsPermissions(cookie())).toBe(false);
    expect(knowsPermissions({ uid: 'u1', rbac: {} } as unknown as IUserInfo)).toBe(false);
    expect(knowsPermissions(null)).toBe(false);
  });
});
