import { renderHook } from '@testing-library/react';

const mockUsePermissions = jest.fn();
jest.mock('@/services/rbac/hooks/usePermissions', () => ({
  usePermissions: () => mockUsePermissions(),
}));

import { usePlaaAccess } from '@/services/rbac/hooks/usePlaaAccess';

// PLAA-66: "PLAA member" is defined by Directory RBAC as a LabOS member holding
// the `plaa.access` permission — not by a separate PLAA-side whitelist.
describe('usePlaaAccess', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mockPerms(permissions: string[], overrides: Record<string, unknown> = {}) {
    mockUsePermissions.mockReturnValue({
      permissions,
      permsSet: new Set(permissions),
      isLoading: false,
      isError: false,
      ...overrides,
    });
  }

  it('grants access when plaa.access is present', () => {
    mockPerms(['plaa.access']);
    const { result } = renderHook(() => usePlaaAccess());
    expect(result.current.canView).toBe(true);
  });

  it('denies access to a logged-in member without plaa.access', () => {
    mockPerms(['forum.read', 'roadmap.view']);
    const { result } = renderHook(() => usePlaaAccess());
    expect(result.current.canView).toBe(false);
  });

  it('denies access when the member has no permissions at all', () => {
    mockPerms([]);
    const { result } = renderHook(() => usePlaaAccess());
    expect(result.current.canView).toBe(false);
  });

  it('does not grant access on a permission that merely starts with the same prefix', () => {
    // `plaa.access` is exact — a future `plaa.accessibility`-style permission
    // must not be mistaken for it.
    mockPerms(['plaa.accessibility']);
    const { result } = renderHook(() => usePlaaAccess());
    expect(result.current.canView).toBe(false);
  });

  it('reports canView false while permissions are still loading, and surfaces isLoading', () => {
    mockPerms([], { isLoading: true });
    const { result } = renderHook(() => usePlaaAccess());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.canView).toBe(false);
  });

  it('surfaces isError so the guard can fail closed rather than rendering the page', () => {
    mockPerms([], { isError: true });
    const { result } = renderHook(() => usePlaaAccess());
    expect(result.current.isError).toBe(true);
    expect(result.current.canView).toBe(false);
  });
});
