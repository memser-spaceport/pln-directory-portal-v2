import { type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { usePlaaAccess } from '@/services/rbac/hooks/usePlaaAccess';
import { PERMISSIONS } from '@/services/rbac/constants';

jest.unmock('@tanstack/react-query');

const mockFetchMyAccess = jest.fn();
jest.mock('@/services/access-control/access-control.service', () => ({
  fetchMyAccess: () => mockFetchMyAccess(),
}));

jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => ({ currentUser: { uid: 'member-1' }, isHydrated: true }),
}));

const access = (memberUid: string, effectivePermissions: string[]) => ({
  memberUid,
  policies: [],
  directPermissions: [],
  effectivePermissions,
});

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('usePlaaAccess', () => {
  afterEach(() => jest.clearAllMocks());

  it('grants access to a member holding plaa.access', async () => {
    mockFetchMyAccess.mockResolvedValue(access('member-1', [PERMISSIONS.PLAA.PERM_ACCESS]));

    const { result } = renderHook(() => usePlaaAccess(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current).toEqual({ canView: true, isLoading: false, isError: false });
  });

  it('denies a member whose real access record lacks plaa.access', async () => {
    mockFetchMyAccess.mockResolvedValue(access('member-1', ['other.permission']));

    const { result } = renderHook(() => usePlaaAccess(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current).toEqual({ canView: false, isLoading: false, isError: false });
  });

  it('reports an error when the access lookup failed and came back empty', async () => {
    mockFetchMyAccess.mockResolvedValue(access('', []));

    const { result } = renderHook(() => usePlaaAccess(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current).toEqual({ canView: false, isLoading: false, isError: true });
  });
});
