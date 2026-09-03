import { renderHook } from '@testing-library/react';

import { useGetPlInfraNavItems } from '@/components/core/navbar/components/navItems/PLInfraNavItems/hook/useGetPlInfraNavItems';
import { useMoreNavItems } from '@/components/core/navbar/components/navItems/MoreNavItems/hooks/useMoreNavItems';
import { PERMISSIONS } from '@/services/rbac/constants';

/**
 * The nav is the only thing standing between a member and a page they have no
 * permission for — the guards behind each route redirect, but a link that should
 * not be there is still a visible claim that the area exists.
 */

const mockPermissions = jest.fn<string[], []>(() => []);

jest.mock('@/services/rbac/hooks/usePermissions', () => ({
  usePermissions: () => {
    const permissions = mockPermissions();
    return { permissions, permsSet: new Set(permissions), isLoading: false, isError: false };
  },
}));

const titlesOf = (items: Array<{ title: string }>) => items.map((i) => i.title);

const plInfra = (...permissions: string[]) => {
  mockPermissions.mockReturnValue(permissions);
  return renderHook(() => useGetPlInfraNavItems()).result.current;
};

const more = (...permissions: string[]) => {
  mockPermissions.mockReturnValue(permissions);
  return renderHook(() => useMoreNavItems()).result.current;
};

beforeEach(() => jest.clearAllMocks());

describe('useGetPlInfraNavItems', () => {
  it('shows nothing to a member with no PL Infra permissions', () => {
    expect(plInfra()).toEqual([]);
  });

  it('shows only the area a member is permitted for', () => {
    expect(titlesOf(plInfra(PERMISSIONS.AI_APPS.PERM_VIEW))).toEqual([
      'AI Apps',
      'PL Infra OS / Factorio',
      'Network Intelligence Dash',
    ]);
    expect(titlesOf(plInfra(PERMISSIONS.INVESTOR_DB.PERM_VIEW))).toEqual(['Network Intelligence Dash', 'Investor DB']);
  });

  it('does not show PL Infra OS without AI Apps access', () => {
    expect(titlesOf(plInfra(PERMISSIONS.GANTRY.PERM_VIEW))).not.toContain('PL Infra OS / Factorio');
  });

  it('lets a roadmap admin in as well as a roadmap viewer', () => {
    expect(plInfra(PERMISSIONS.GANTRY.PERM_ADMIN)).toHaveLength(2);
    expect(plInfra(PERMISSIONS.GANTRY.PERM_VIEW)).toHaveLength(2);
  });

  it('lets an agent-sessions admin in as well as a viewer', () => {
    expect(plInfra(PERMISSIONS.AGENT_SESSIONS.PERM_ADMIN)).toHaveLength(2);
    expect(plInfra(PERMISSIONS.AGENT_SESSIONS.PERM_VIEW)).toHaveLength(2);
  });

  it('keeps a stable order as permissions accumulate, so the nav does not reshuffle', () => {
    const all = plInfra(
      PERMISSIONS.AGENT_SESSIONS.PERM_VIEW,
      PERMISSIONS.AI_APPS.PERM_VIEW,
      PERMISSIONS.INVESTOR_DB.PERM_VIEW,
      PERMISSIONS.GANTRY.PERM_VIEW,
    );

    expect(titlesOf(all)).toEqual([
      'AI Apps',
      'Gantry',
      'PL Infra OS / Factorio',
      'Network Intelligence Dash',
      'Investor DB',
      'Agent Sessions',
    ]);
  });

  it('does not show Founder DB, which is behind a kill switch', () => {
    const all = plInfra(PERMISSIONS.FOUNDER_DB.PERM_VIEW, PERMISSIONS.GANTRY.PERM_VIEW, PERMISSIONS.AI_APPS.PERM_VIEW);

    expect(titlesOf(all)).not.toContain('Founder DB');
  });

  it('gives every internal item a route, so no entry renders as a dead link', () => {
    const all = plInfra(
      PERMISSIONS.GANTRY.PERM_VIEW,
      PERMISSIONS.INVESTOR_DB.PERM_VIEW,
      PERMISSIONS.AI_APPS.PERM_VIEW,
      PERMISSIONS.AGENT_SESSIONS.PERM_VIEW,
    );

    all
      .filter((item) => !('external' in item && item.external))
      .forEach((item) => expect(item.href).toEqual(expect.stringMatching(/^\//)));
    expect(all.find((item) => item.title === 'PL Infra OS / Factorio')?.href).toBe('/pl-infra-os');
  });

  it('sends Network Intelligence Dash to the external reports site, marked to open in a new tab', () => {
    const link = plInfra(PERMISSIONS.INVESTOR_DB.PERM_VIEW).find((item) => item.title === 'Network Intelligence Dash');

    expect(link?.href).toBe('https://intelligence-reports.plnetwork.io/');
    expect(link).toMatchObject({ external: true });
  });

  it('keeps the same array while permissions are unchanged', () => {
    mockPermissions.mockReturnValue([PERMISSIONS.AI_APPS.PERM_VIEW]);
    const { result, rerender } = renderHook(() => useGetPlInfraNavItems());
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});

describe('useMoreNavItems', () => {
  it('shows Deals and Jobs to everyone', () => {
    expect(titlesOf(more())).toEqual(['Deals', 'Job Board']);
  });

  it('slots Founder Guides between them for a permitted member', () => {
    expect(titlesOf(more(PERMISSIONS.FOUNDER_GUIDE.PERM_VIEW))).toEqual(['Deals', 'Founder Guides', 'Job Board']);
  });

  it('accepts a scoped founder-guides permission, matching by prefix', () => {
    expect(titlesOf(more(`${PERMISSIONS.FOUNDER_GUIDE.PERM_VIEW}.beta`))).toContain('Founder Guides');
  });

  it("does not let another area's permission open Founder Guides", () => {
    expect(titlesOf(more(PERMISSIONS.AI_APPS.PERM_VIEW, PERMISSIONS.GANTRY.PERM_VIEW))).toEqual(['Deals', 'Job Board']);
  });

  it('shows PLAA only to a member holding plaa.access', () => {
    expect(titlesOf(more())).not.toContain('PLAA');
    expect(titlesOf(more(PERMISSIONS.PLAA.PERM_ACCESS))).toContain('PLAA');
  });

  it('sends PLAA to /alignment-asset in the same tab — no target, so NavLink renders a plain next/link', () => {
    const plaa = more(PERMISSIONS.PLAA.PERM_ACCESS).find((item) => item.title === 'PLAA');

    expect(plaa?.href).toBe('/alignment-asset');
    expect(plaa).not.toHaveProperty('target');
  });

  it("does not let another area's permission open PLAA", () => {
    expect(titlesOf(more(PERMISSIONS.AI_APPS.PERM_VIEW, PERMISSIONS.FOUNDER_GUIDE.PERM_VIEW))).not.toContain('PLAA');
  });

  it('does not accept a scoped plaa permission — the code is matched exactly', () => {
    expect(titlesOf(more(`${PERMISSIONS.PLAA.PERM_ACCESS}.admin`))).not.toContain('PLAA');
  });

  /** A logged-out visitor never reaches the access endpoint (`usePermissions`
   *  gates the query on `currentUser`), so their permission list is empty —
   *  the same state this asserts. */
  it('shows a logged-out visitor no permission-gated item at all', () => {
    expect(titlesOf(more())).toEqual(['Deals', 'Job Board']);
  });

  it('appends PLAA below the items that were already there, so the menu does not reshuffle', () => {
    const all = more(PERMISSIONS.FOUNDER_GUIDE.PERM_VIEW, PERMISSIONS.PLAA.PERM_ACCESS);

    expect(titlesOf(all)).toEqual(['Deals', 'Founder Guides', 'Job Board', 'PLAA']);
  });

  it('keeps the same array while permissions are unchanged', () => {
    mockPermissions.mockReturnValue([]);
    const { result, rerender } = renderHook(() => useMoreNavItems());
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});
