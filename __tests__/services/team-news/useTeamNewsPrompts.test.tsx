import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

// jest.setup.js stubs useQuery globally; this hook is about what the real query resolves to.
jest.unmock('@tanstack/react-query');

import { useTeamNewsPrompts } from '@/services/team-news/hooks/useTeamNewsPrompts';
import { NEWS_PROMPT_CANDIDATE_LIMIT } from '@/services/team-news/newsPrompts';
import { getTeamNewsNewest } from '@/services/team-news/team-news.service';

jest.mock('@/services/team-news/team-news.service', () => ({ getTeamNewsNewest: jest.fn() }));

const getNewestMock = getTeamNewsNewest as jest.MockedFunction<typeof getTeamNewsNewest>;

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
    getNewestMock.mockResolvedValue([
      { uid: 'n1', teamName: 'Saturn Grid', title: 'Saturn Grid ships v2', editorialRank: 1 } as any,
    ]);

    const { result } = renderHook(() => useTeamNewsPrompts(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getNewestMock).toHaveBeenCalledWith(NEWS_PROMPT_CANDIDATE_LIMIT);
    expect(result.current.data).toEqual([
      { uid: 'n1', question: 'What is the news from Saturn Grid: "Saturn Grid ships v2"?' },
    ]);
  });

  it('gives no prompts when the news request fails', async () => {
    getNewestMock.mockResolvedValue(null);

    const { result } = renderHook(() => useTeamNewsPrompts(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});
