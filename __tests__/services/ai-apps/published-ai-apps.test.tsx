import { renderHook } from '@testing-library/react';
import { useQuery } from '@tanstack/react-query';

import { customFetch } from '@/utils/fetch-wrapper';
import { fetchPublishedAiApps } from '@/services/ai-apps/ai-apps.service';
import { usePublishedAiApps } from '@/services/ai-apps/hooks/usePublishedAiApps';
import { useCurrentUserStore } from '@/services/auth/store';

jest.mock('@/utils/fetch-wrapper', () => ({
  customFetch: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

const mockCustomFetch = customFetch as jest.MockedFunction<typeof customFetch>;
const mockUseQuery = useQuery as jest.Mock;

const jsonResponse = (status: number, body: unknown = {}) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  }) as unknown as Response;

const playbook = {
  uid: 'cmplaybook1',
  appId: 'playbook',
  name: 'PLaybook',
  description: null,
  url: 'https://playbook.os.pl.xyz',
};

describe('fetchPublishedAiApps', () => {
  beforeEach(() => jest.clearAllMocks());

  it('asks the published endpoint as the signed-in member', async () => {
    mockCustomFetch.mockResolvedValue(jsonResponse(200, { apps: [playbook] }));

    await expect(fetchPublishedAiApps()).resolves.toEqual([playbook]);
    expect(mockCustomFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/v1\/ai-apps\/published$/),
      { method: 'GET' },
      true,
    );
  });

  it('reads a body without an apps list as none', async () => {
    mockCustomFetch.mockResolvedValue(jsonResponse(200, {}));

    await expect(fetchPublishedAiApps()).resolves.toEqual([]);
  });

  // Thrown, not swallowed: a failed background refetch then keeps the last good list.
  it.each([401, 403, 404, 500])('throws on a %s, so the cache keeps what it had', async (status) => {
    mockCustomFetch.mockResolvedValue(jsonResponse(status));

    await expect(fetchPublishedAiApps()).rejects.toThrow();
  });

  it('throws when there is no response at all (the sign-out path)', async () => {
    mockCustomFetch.mockResolvedValue(undefined as unknown as Response);

    await expect(fetchPublishedAiApps()).rejects.toThrow();
  });
});

describe('usePublishedAiApps', () => {
  const signedIn = { uid: 'm-1', name: 'Ada' } as never;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQuery.mockReturnValue({ data: undefined, isPending: true });
  });

  afterEach(() => useCurrentUserStore.setState({ currentUser: null, isHydrated: false }));

  it('requests nothing for a signed-out visitor, and is not left loading', () => {
    useCurrentUserStore.setState({ currentUser: null, isHydrated: true });

    const { result } = renderHook(() => usePublishedAiApps());

    expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
    expect(result.current).toEqual({ apps: [], isLoading: false });
  });

  it('requests the list for a signed-in member, keyed by that member', () => {
    useCurrentUserStore.setState({ currentUser: signedIn, isHydrated: true });

    const { result } = renderHook(() => usePublishedAiApps());

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true, queryKey: ['ai-apps-published', 'm-1'] }),
    );
    expect(result.current.isLoading).toBe(true);
  });

  it('hands over the published apps once they arrive', () => {
    useCurrentUserStore.setState({ currentUser: signedIn, isHydrated: true });
    mockUseQuery.mockReturnValue({ data: [playbook], isPending: false });

    const { result } = renderHook(() => usePublishedAiApps());

    expect(result.current).toEqual({ apps: [playbook], isLoading: false });
  });

  it('reads a failed request as an empty list, so the nav never breaks', () => {
    useCurrentUserStore.setState({ currentUser: signedIn, isHydrated: true });
    mockUseQuery.mockReturnValue({ data: undefined, isPending: false, isError: true });

    const { result } = renderHook(() => usePublishedAiApps());

    expect(result.current).toEqual({ apps: [], isLoading: false });
  });

  it('keeps the same empty list between renders, so the nav memo holds', () => {
    useCurrentUserStore.setState({ currentUser: signedIn, isHydrated: true });
    mockUseQuery.mockReturnValue({ data: undefined, isPending: false });

    const { result, rerender } = renderHook(() => usePublishedAiApps());
    const first = result.current.apps;
    rerender();

    expect(result.current.apps).toBe(first);
  });
});
