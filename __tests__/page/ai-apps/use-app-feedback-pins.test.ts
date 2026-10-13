import { renderHook } from '@testing-library/react';
import { LIVE_PINS_INTERVAL_MS, useAppFeedbackPins } from '@/services/ai-app-feedback/hooks/useAppFeedbackPins';

/* What the hook asks React Query for is the subject here, not the cache. */
const mockUseQuery = jest.fn((_options: Record<string, unknown>) => ({ data: [], isLoading: false, isError: false }));
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: (options: Record<string, unknown>) => mockUseQuery(options),
}));

const base = { appUid: 'app-1', scope: 'all' as const, includeResolved: true, enabled: true };

describe('useAppFeedbackPins freshness', () => {
  it('while comment mode is on, re-reads every minute and on every return to the window', () => {
    renderHook(() => useAppFeedbackPins({ ...base, live: true }));
    expect(mockUseQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ refetchInterval: LIVE_PINS_INTERVAL_MS, refetchOnWindowFocus: 'always' }),
    );
    expect(LIVE_PINS_INTERVAL_MS).toBe(60_000);
  });

  it('otherwise does not poll', () => {
    renderHook(() => useAppFeedbackPins(base));
    expect(mockUseQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ refetchInterval: false, refetchOnWindowFocus: true }),
    );
  });
});
