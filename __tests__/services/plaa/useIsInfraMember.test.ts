import { renderHook } from '@testing-library/react';

const mockUseQuery = jest.fn();
jest.mock('@tanstack/react-query', () => ({
  useQuery: (options: unknown) => mockUseQuery(options),
}));

const mockCurrentUser = jest.fn();
jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => ({ currentUser: mockCurrentUser() }),
}));

import { AccessControlQueryKeys } from '@/services/access-control/constants';
import { fetchMyAccess } from '@/services/access-control/access-control.service';
import { hasInfraPolicy, PL_INFRA_TEAM_POLICY, useIsInfraMember } from '@/services/plaa/hooks/useIsInfraMember';

const policy = (code: string) => ({ uid: code, code, name: code, role: '', group: '', permissions: [] });

describe('hasInfraPolicy', () => {
  it('is true for the PL Infra Team policy, alone or among others', () => {
    expect(hasInfraPolicy([PL_INFRA_TEAM_POLICY])).toBe(true);
    expect(hasInfraPolicy(['investor_pl', PL_INFRA_TEAM_POLICY, 'directory_admin_pl_internal'])).toBe(true);
  });

  it('is false with no policies or only other PL Internal policies', () => {
    expect(hasInfraPolicy([])).toBe(false);
    expect(hasInfraPolicy(['directory_admin_pl_internal', 'pl_investment_team_pl_internal', 'investor_pl'])).toBe(
      false,
    );
  });

  it('does not match on a partial code', () => {
    expect(hasInfraPolicy(['pl_infra_team', 'pl_infra_team_pl_partner'])).toBe(false);
  });
});

describe('useIsInfraMember', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockCurrentUser.mockReturnValue({ uid: 'member-1' });
  });

  it('reads /me/access through the shared access query, so it reuses the cached response', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isError: false });
    renderHook(() => useIsInfraMember());

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: [AccessControlQueryKeys.MY_ACCESS], queryFn: fetchMyAccess, enabled: true }),
    );
  });

  it('is true when /me/access lists the PL Infra Team policy', () => {
    mockUseQuery.mockReturnValue({
      data: {
        memberUid: 'member-1',
        policies: [policy('investor_pl'), policy(PL_INFRA_TEAM_POLICY)],
        directPermissions: [],
        effectivePermissions: [],
      },
      isError: false,
    });

    expect(renderHook(() => useIsInfraMember()).result.current).toBe(true);
  });

  it('is false when /me/access has no Infra policy', () => {
    mockUseQuery.mockReturnValue({
      data: {
        memberUid: 'member-1',
        policies: [policy('investor_pl')],
        directPermissions: [],
        effectivePermissions: [],
      },
      isError: false,
    });

    expect(renderHook(() => useIsInfraMember()).result.current).toBe(false);
  });

  it('is false while loading or after an error, never guessing', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isError: false });
    expect(renderHook(() => useIsInfraMember()).result.current).toBe(false);

    mockUseQuery.mockReturnValue({
      data: {
        memberUid: 'member-1',
        policies: [policy(PL_INFRA_TEAM_POLICY)],
        directPermissions: [],
        effectivePermissions: [],
      },
      isError: true,
    });
    expect(renderHook(() => useIsInfraMember()).result.current).toBe(false);
  });

  it('does not query when signed out', () => {
    mockCurrentUser.mockReturnValue(null);
    mockUseQuery.mockReturnValue({ data: undefined, isError: false });
    renderHook(() => useIsInfraMember());

    expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  });
});
