import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

jest.unmock('@tanstack/react-query');

import { useAiAppFeedbackList } from '@/services/ai-app-feedback/hooks/useAiAppFeedbackList';
import { fetchAccessibleAiAppFeedback } from '@/services/ai-app-feedback/ai-app-feedback.service';
import type { AiAppFeedbackRow } from '@/services/ai-app-feedback/ai-app-feedback.service';

jest.mock('@/services/ai-app-feedback/ai-app-feedback.service', () => ({
  fetchAccessibleAiAppFeedback: jest.fn(),
}));

const mockFetch = fetchAccessibleAiAppFeedback as jest.MockedFunction<typeof fetchAccessibleAiAppFeedback>;

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const FEEDBACK: AiAppFeedbackRow[] = [
  {
    uid: 'fb-2',
    appUid: 'app-2',
    appName: 'Beta',
    text: 'newer',
    status: 'VIEWED',
    member: null,
    createdAt: '2026-07-05T00:00:00.000Z',
  },
  {
    uid: 'fb-1',
    appUid: 'app-1',
    appName: 'Alpha',
    text: 'older',
    status: 'NEW',
    member: null,
    createdAt: '2026-07-01T00:00:00.000Z',
  },
];

describe('useAiAppFeedbackList', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('loads all accessible feedback in a single request', async () => {
    mockFetch.mockResolvedValue(FEEDBACK);

    const { result } = renderHook(() => useAiAppFeedbackList(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.current.feedback).toEqual(FEEDBACK);
    expect(result.current.isError).toBe(false);
  });

  it('surfaces an empty list when the caller has no reviewable feedback', async () => {
    mockFetch.mockResolvedValue([]);

    const { result } = renderHook(() => useAiAppFeedbackList(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.feedback).toEqual([]);
    expect(result.current.isError).toBe(false);
  });
});
