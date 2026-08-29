import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

// jest.setup.js stubs useQuery globally, not useQueries — but unmock to be explicit
// and get the real caching behaviour asserted below.
jest.unmock('@tanstack/react-query');

import { useSnapshotPointsHistory } from '@/services/plaa/hooks/useSnapshotPointsHistory';

const mockFetchSnapshotPoints = jest.fn();
jest.mock('@/services/points/hooks/usePoints', () => ({
  ...jest.requireActual('@/services/points/hooks/usePoints'),
  fetchSnapshotPoints: (period: string) => mockFetchSnapshotPoints(period),
}));

describe('useSnapshotPointsHistory', () => {
  let client: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  it('fetches one query per period and keys the result by that period', async () => {
    mockFetchSnapshotPoints.mockImplementation((period: string) =>
      Promise.resolve({ snapshotPeriod: period, records: [] })
    );

    const { result } = renderHook(() => useSnapshotPointsHistory(['2026-05-26', '2026-06-26']), { wrapper });

    await waitFor(() => expect(result.current['2026-05-26']).not.toBeUndefined());
    expect(mockFetchSnapshotPoints).toHaveBeenCalledWith('2026-05-26');
    expect(mockFetchSnapshotPoints).toHaveBeenCalledWith('2026-06-26');
    expect(result.current['2026-06-26']).toEqual({ snapshotPeriod: '2026-06-26', records: [] });
  });

  it('reports undefined for a period still in flight, distinct from null once settled with no data', async () => {
    mockFetchSnapshotPoints.mockReturnValue(new Promise(() => {})); // never resolves

    const { result } = renderHook(() => useSnapshotPointsHistory(['2026-07-26']), { wrapper });

    expect(result.current['2026-07-26']).toBeUndefined();
  });

  it('reports null, not undefined, once a period settles with no data', async () => {
    mockFetchSnapshotPoints.mockResolvedValue(null);

    const { result } = renderHook(() => useSnapshotPointsHistory(['2026-07-26']), { wrapper });

    await waitFor(() => expect(result.current['2026-07-26']).toBeNull());
  });

  it('fetches nothing and returns an empty map for an empty period list', () => {
    const { result } = renderHook(() => useSnapshotPointsHistory([]), { wrapper });

    expect(mockFetchSnapshotPoints).not.toHaveBeenCalled();
    expect(result.current).toEqual({});
  });
});
