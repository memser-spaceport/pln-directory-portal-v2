/**
 * LAB-3254: the drawer's description. A role that carries its body never fetches; one the board's server page sent
 * without it (`descriptionOmitted`) is fetched by uid.
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const mockFetchJobByUid = jest.fn();
jest.mock('@/services/jobs/jobs.service', () => ({ fetchJobByUid: (uid: string) => mockFetchJobByUid(uid) }));

// jest.setup.js replaces useQuery with a stub; this hook is the thing under test, so it gets the real one.
jest.mock('@tanstack/react-query', () => jest.requireActual('@tanstack/react-query'));

import { useRoleDescriptionHtml } from '@/services/jobs/hooks/useRoleDescriptionHtml';
import type { IJobRole } from '@/types/jobs.types';

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

const role = (overrides: Partial<IJobRole>) => ({ uid: 'r1', roleTitle: 'Engineer', ...overrides }) as IJobRole;

describe('useRoleDescriptionHtml', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uses the body a role carries, without fetching', () => {
    const { result } = renderHook(() => useRoleDescriptionHtml(role({ descriptionHtml: '<p>Own body</p>' })), {
      wrapper,
    });

    expect(result.current).toEqual({ html: '<p>Own body</p>', isLoading: false });
    expect(mockFetchJobByUid).not.toHaveBeenCalled();
  });

  it('fetches the body of a role that arrived without it', async () => {
    mockFetchJobByUid.mockResolvedValue({ team: {}, roles: [{ uid: 'r1', descriptionHtml: '<p>Fetched</p>' }] });

    const { result } = renderHook(() => useRoleDescriptionHtml(role({ descriptionOmitted: true })), { wrapper });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current).toEqual({ html: '<p>Fetched</p>', isLoading: false }));
    expect(mockFetchJobByUid).toHaveBeenCalledWith('r1');
  });

  it('settles on no body when the role has none, so the pane can say so', async () => {
    mockFetchJobByUid.mockResolvedValue({ team: {}, roles: [{ uid: 'r1', descriptionHtml: null }] });

    const { result } = renderHook(() => useRoleDescriptionHtml(role({ descriptionOmitted: true })), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.html).toBeNull();
  });
});
