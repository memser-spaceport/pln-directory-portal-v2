import {
  resolveQuickActionsState,
  codesFromCookiePolicies,
  codesFromCookiePermissions,
} from '@/components/page/home/QuickActions/utils/resolveQuickActionsState';
import type { IUserInfo } from '@/types/shared.types';

describe('resolveQuickActionsState', () => {
  describe('group', () => {
    it('returns pl-infra for the PL internal policy', () => {
      expect(resolveQuickActionsState(['pl_infra_team_pl_internal'], []).group).toBe('pl-infra');
    });

    it('returns founder for any founder_plc_ prefixed policy', () => {
      expect(resolveQuickActionsState(['founder_plc_acme'], []).group).toBe('founder');
    });

    it('prefers pl-infra when a member holds both', () => {
      expect(resolveQuickActionsState(['founder_plc_acme', 'pl_infra_team_pl_internal'], []).group).toBe('pl-infra');
    });

    it('returns others for no policies or unrecognised ones', () => {
      expect(resolveQuickActionsState([], []).group).toBe('others');
      expect(resolveQuickActionsState(['some_other_policy'], []).group).toBe('others');
    });

    it('does not treat a bare founder_ policy as founder', () => {
      expect(resolveQuickActionsState(['founder_guides_reader'], []).group).toBe('others');
    });
  });

  describe('hasOhAccess', () => {
    it.each(['oh.supply.read', 'oh.supply.write', 'oh.demand.read', 'oh.demand.write'])(
      'is true when %s is granted on its own',
      (code) => {
        expect(resolveQuickActionsState([], [code]).hasOhAccess).toBe(true);
      },
    );

    it('is false with no office hours permissions', () => {
      expect(resolveQuickActionsState([], ['deals.read', 'directory.admin.full']).hasOhAccess).toBe(false);
    });
  });

  describe('hasDealsAccess', () => {
    it('tracks the deals.read permission', () => {
      expect(resolveQuickActionsState([], ['deals.read']).hasDealsAccess).toBe(true);
      expect(resolveQuickActionsState([], []).hasDealsAccess).toBe(false);
    });

    // The server unions /me/access and cookie permissions because the two sets
    // diverge in both directions; deals.read reaching the resolver from either
    // side alone has to be enough, or the union would be pointless.
    it('is true when deals.read arrives from only one of the merged sources', () => {
      const fromMyAccess = ['deals.read', 'oh.supply.read'];
      const fromCookie = ['some.other.permission'];

      expect(resolveQuickActionsState([], [...fromMyAccess, ...fromCookie]).hasDealsAccess).toBe(true);
      expect(resolveQuickActionsState([], [...fromCookie, ...fromMyAccess]).hasDealsAccess).toBe(true);
    });
  });
});

describe('cookie normalisers', () => {
  const rbac = {
    status: 'APPROVED',
    policies: [{ uid: 'p1', code: 'pl_infra_team_pl_internal', name: 'PL', description: null, role: '', group: '' }],
    effectivePermissions: [{ uid: 'e1', code: 'deals.read', description: '' }],
    roles: [],
  } as NonNullable<IUserInfo['rbac']>;

  it('maps the cookie objects down to plain code arrays', () => {
    expect(codesFromCookiePolicies(rbac)).toEqual(['pl_infra_team_pl_internal']);
    expect(codesFromCookiePermissions(rbac)).toEqual(['deals.read']);
  });

  it('returns empty arrays for missing or null rbac', () => {
    expect(codesFromCookiePolicies(null)).toEqual([]);
    expect(codesFromCookiePermissions(null)).toEqual([]);
    expect(codesFromCookiePolicies(undefined)).toEqual([]);
    expect(codesFromCookiePermissions(undefined)).toEqual([]);
  });

  it('feeds resolveQuickActionsState end to end', () => {
    expect(resolveQuickActionsState(codesFromCookiePolicies(rbac), codesFromCookiePermissions(rbac))).toEqual({
      group: 'pl-infra',
      hasDealsAccess: true,
      hasOhAccess: false,
    });
  });
});
