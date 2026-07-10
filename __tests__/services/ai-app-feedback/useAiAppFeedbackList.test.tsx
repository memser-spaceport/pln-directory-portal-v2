import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

jest.unmock('@tanstack/react-query');

import { useAiAppFeedbackList } from '@/services/ai-app-feedback/hooks/useAiAppFeedbackList';
import { fetchAiAppFeedbackForApp } from '@/services/ai-app-feedback/ai-app-feedback.service';
import { fetchMyAccess } from '@/services/access-control/access-control.service';

jest.mock('@/services/ai-app-feedback/ai-app-feedback.service', () => ({
  fetchAiAppFeedbackForApp: jest.fn(),
}));

jest.mock('@/services/access-control/access-control.service', () => ({
  fetchMyAccess: jest.fn(),
}));

const mockUseAiApps = jest.fn();
jest.mock('@/services/ai-apps/hooks/useAiApps', () => ({
  useAiApps: () => mockUseAiApps(),
}));

const mockUseCurrentUserStore = jest.fn();
jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => mockUseCurrentUserStore(),
}));

const mockFetchAiAppFeedbackForApp = fetchAiAppFeedbackForApp as jest.MockedFunction<typeof fetchAiAppFeedbackForApp>;
const mockFetchMyAccess = fetchMyAccess as jest.MockedFunction<typeof fetchMyAccess>;

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const APPS = [
  { uid: 'app-1', name: 'Alpha', member: { uid: 'creator-1', name: 'Ada' } },
  { uid: 'app-2', name: 'Beta', member: { uid: 'creator-2', name: 'Bea' } },
];

describe('useAiAppFeedbackList', () => {
  beforeEach(() => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: { uid: 'creator-1', name: 'Ada' } });
    mockFetchMyAccess.mockResolvedValue({
      memberUid: 'creator-1',
      policies: [],
      directPermissions: [],
      effectivePermissions: [],
    });
    mockFetchAiAppFeedbackForApp.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('only fetches feedback for apps the current member created when not a directory admin', async () => {
    mockUseAiApps.mockReturnValue({ apps: APPS, isLoading: false, isError: false });

    const { result } = renderHook(() => useAiAppFeedbackList(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockFetchAiAppFeedbackForApp).toHaveBeenCalledTimes(1);
    expect(mockFetchAiAppFeedbackForApp).toHaveBeenCalledWith('app-1');
    expect(mockFetchAiAppFeedbackForApp).not.toHaveBeenCalledWith('app-2');
  });

  it('fetches feedback across every app when the member is a directory admin', async () => {
    mockUseAiApps.mockReturnValue({ apps: APPS, isLoading: false, isError: false });
    mockFetchMyAccess.mockResolvedValue({
      memberUid: 'creator-1',
      policies: [],
      directPermissions: [],
      effectivePermissions: ['directory.admin.full'],
    });

    const { result } = renderHook(() => useAiAppFeedbackList(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockFetchAiAppFeedbackForApp).toHaveBeenCalledWith('app-1');
    expect(mockFetchAiAppFeedbackForApp).toHaveBeenCalledWith('app-2');
  });

  it('tags each row with its app name and sorts newest first across apps', async () => {
    mockUseAiApps.mockReturnValue({ apps: APPS, isLoading: false, isError: false });
    mockFetchMyAccess.mockResolvedValue({
      memberUid: 'creator-1',
      policies: [],
      directPermissions: [],
      effectivePermissions: ['directory.admin.full'],
    });
    mockFetchAiAppFeedbackForApp.mockImplementation((appUid: string) =>
      Promise.resolve(
        appUid === 'app-1'
          ? [{ uid: 'fb-1', appUid: 'app-1', text: 'older', member: null, createdAt: '2026-07-01T00:00:00.000Z' }]
          : [{ uid: 'fb-2', appUid: 'app-2', text: 'newer', member: null, createdAt: '2026-07-05T00:00:00.000Z' }],
      ),
    );

    const { result } = renderHook(() => useAiAppFeedbackList(), { wrapper });

    await waitFor(() => expect(result.current.feedback).toHaveLength(2));

    expect(result.current.feedback.map((row) => row.uid)).toEqual(['fb-2', 'fb-1']);
    expect(result.current.feedback[0].appName).toBe('Beta');
    expect(result.current.feedback[1].appName).toBe('Alpha');
  });

  it('treats a 403/404 for one app (empty array from the service) as no feedback rather than an error', async () => {
    mockUseAiApps.mockReturnValue({ apps: APPS, isLoading: false, isError: false });
    mockFetchMyAccess.mockResolvedValue({
      memberUid: 'creator-1',
      policies: [],
      directPermissions: [],
      effectivePermissions: ['directory.admin.full'],
    });
    mockFetchAiAppFeedbackForApp.mockImplementation((appUid: string) =>
      Promise.resolve(
        appUid === 'app-1'
          ? [{ uid: 'fb-1', appUid: 'app-1', text: 'hi', member: null, createdAt: '2026-07-01T00:00:00.000Z' }]
          : [],
      ),
    );

    const { result } = renderHook(() => useAiAppFeedbackList(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(false);
    expect(result.current.feedback).toHaveLength(1);
  });
});
