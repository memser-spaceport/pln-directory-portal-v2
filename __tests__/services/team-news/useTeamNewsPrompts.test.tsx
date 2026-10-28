import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

// jest.setup.js stubs useQuery globally; this hook is about what the real query resolves to.
jest.unmock('@tanstack/react-query');

import { useTeamNewsPrompts } from '@/services/team-news/hooks/useTeamNewsPrompts';
import { getTeamNewsGroupedByFocusArea } from '@/services/team-news/team-news.service';

jest.mock('@/services/team-news/team-news.service', () => ({ getTeamNewsGroupedByFocusArea: jest.fn() }));

const getGroupedMock = getTeamNewsGroupedByFocusArea as jest.MockedFunction<typeof getTeamNewsGroupedByFocusArea>;

describe('useTeamNewsPrompts', () => {
  let client: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }

  it('turns the news feed into prompts', async () => {
    getGroupedMock.mockResolvedValue({
      windowDays: 14,
      generatedAt: '2026-10-28T00:00:00.000Z',
      groups: [
        {
          focusArea: {} as any,
          total: 1,
          items: [{ uid: 'n1', teamName: 'Saturn Grid', title: 'Saturn Grid ships v2', editorialRank: 1 } as any],
        },
      ],
    });

    const { result } = renderHook(() => useTeamNewsPrompts(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([
      { uid: 'n1', question: 'What is the news from Saturn Grid: "Saturn Grid ships v2"?' },
    ]);
  });

  it('gives no prompts when the news request fails', async () => {
    getGroupedMock.mockResolvedValue(null);

    const { result } = renderHook(() => useTeamNewsPrompts(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});
