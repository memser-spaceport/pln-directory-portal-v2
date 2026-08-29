import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

// jest.setup.js stubs useQuery globally; this test needs the real client.
jest.unmock('@tanstack/react-query');

import { useSnapshotPointsHistory } from '@/services/plaa/hooks/useSnapshotPointsHistory';

const mockFetchPointsHistory = jest.fn();
jest.mock('@/services/points/hooks/usePoints', () => ({
  ...jest.requireActual('@/services/points/hooks/usePoints'),
  fetchPointsHistory: () => mockFetchPointsHistory(),
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

  it('fetches the whole history in a single call regardless of how many periods are requested', async () => {
    mockFetchPointsHistory.mockResolvedValue([{ snapshotPeriod: '2026-05-01', records: [] }]);

    const { result } = renderHook(
      () => useSnapshotPointsHistory(['2026-05-26', '2026-06-26', '2026-07-26']),
      { wrapper }
    );

    await waitFor(() => expect(result.current['2026-05-26']).not.toBeUndefined());
    expect(mockFetchPointsHistory).toHaveBeenCalledTimes(1);
  });

  it('matches each period to its month by year-month, regardless of the day in the period string', async () => {
    mockFetchPointsHistory.mockResolvedValue([
      { snapshotPeriod: '2026-05-01', records: [{ category: 'Category A', activityName: 'Activity 1', description: '', pointsCollectedPerSnapshot: 150 }] },
    ]);

    const { result } = renderHook(() => useSnapshotPointsHistory(['2026-05-26']), { wrapper });

    await waitFor(() => expect(result.current['2026-05-26']).not.toBeUndefined());
    expect(result.current['2026-05-26']).toEqual({
      snapshotPeriod: '2026-05-01',
      records: [{ category: 'Category A', activityName: 'Activity 1', description: '', pointsCollectedPerSnapshot: 150 }],
    });
  });

  it('reports undefined for every period while the single query is in flight', () => {
    mockFetchPointsHistory.mockReturnValue(new Promise(() => {})); // never resolves

    const { result } = renderHook(() => useSnapshotPointsHistory(['2026-05-26', '2026-06-26']), { wrapper });

    expect(result.current['2026-05-26']).toBeUndefined();
    expect(result.current['2026-06-26']).toBeUndefined();
  });

  it('reports null, not undefined, for a period with no matching month once settled', async () => {
    mockFetchPointsHistory.mockResolvedValue([{ snapshotPeriod: '2026-05-01', records: [] }]);

    const { result } = renderHook(() => useSnapshotPointsHistory(['2026-06-26']), { wrapper });

    await waitFor(() => expect(result.current['2026-06-26']).toBeNull());
  });

  it('reports null for every period when the history request settles with no data', async () => {
    mockFetchPointsHistory.mockResolvedValue(null);

    const { result } = renderHook(() => useSnapshotPointsHistory(['2026-05-26']), { wrapper });

    await waitFor(() => expect(result.current['2026-05-26']).toBeNull());
  });

  it('returns an empty map for an empty period list, without skipping the fetch', async () => {
    mockFetchPointsHistory.mockResolvedValue([]);

    const { result } = renderHook(() => useSnapshotPointsHistory([]), { wrapper });

    await waitFor(() => expect(mockFetchPointsHistory).toHaveBeenCalledTimes(1));
    expect(result.current).toEqual({});
  });
});
