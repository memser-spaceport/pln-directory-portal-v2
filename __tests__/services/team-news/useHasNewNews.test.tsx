import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

// jest.setup.js stubs useQuery globally; this hook is about what the real query
// resolves to, combined with local storage.
jest.unmock('@tanstack/react-query');

import { useHasNewNews } from '@/services/team-news/hooks/useHasNewNews';
import { getTeamNewsLatestAt } from '@/services/team-news/team-news.service';
import { markHomeVisited } from '@/utils/homeLastVisited';

jest.mock('@/services/team-news/team-news.service', () => ({ getTeamNewsLatestAt: jest.fn() }));

const getTeamNewsLatestAtMock = getTeamNewsLatestAt as jest.MockedFunction<typeof getTeamNewsLatestAt>;

describe('useHasNewNews', () => {
  let client: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    window.localStorage.clear();
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }

  function visitedAt(ms: number) {
    jest.spyOn(Date, 'now').mockReturnValue(ms);
    markHomeVisited();
  }

  it('shows the dot when news landed after the last visit', async () => {
    visitedAt(Date.parse('2026-08-14T09:00:00.000Z'));
    getTeamNewsLatestAtMock.mockResolvedValue('2026-08-14T10:00:00.000Z');

    const { result } = renderHook(() => useHasNewNews(), { wrapper });

    await waitFor(() => expect(result.current).toBe(true));
  });

  it('stays clear when the newest news predates the last visit', async () => {
    visitedAt(Date.parse('2026-08-14T11:00:00.000Z'));
    getTeamNewsLatestAtMock.mockResolvedValue('2026-08-14T10:00:00.000Z');

    const { result } = renderHook(() => useHasNewNews(), { wrapper });

    await waitFor(() => expect(getTeamNewsLatestAtMock).toHaveBeenCalled());
    expect(result.current).toBe(false);
  });

  it('shows the dot for a browser that has never opened /home', async () => {
    getTeamNewsLatestAtMock.mockResolvedValue('2026-08-14T10:00:00.000Z');

    const { result } = renderHook(() => useHasNewNews(), { wrapper });

    // All of it is new to them, and the dot is how they find a feed they have
    // never opened.
    await waitFor(() => expect(result.current).toBe(true));
  });

  it.each([
    ['no news exists', null],
    ['the timestamp is unparseable', 'not-a-date'],
  ])('stays clear when %s', async (_label, latestAt) => {
    getTeamNewsLatestAtMock.mockResolvedValue(latestAt);

    const { result } = renderHook(() => useHasNewNews(), { wrapper });

    await waitFor(() => expect(getTeamNewsLatestAtMock).toHaveBeenCalled());
    expect(result.current).toBe(false);
  });

  it('never flashes a dot before the request lands', () => {
    getTeamNewsLatestAtMock.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useHasNewNews(), { wrapper });

    expect(result.current).toBe(false);
  });

  it('clears as soon as the visit is recorded, without a reload', async () => {
    getTeamNewsLatestAtMock.mockResolvedValue('2026-08-14T10:00:00.000Z');

    const { result } = renderHook(() => useHasNewNews(), { wrapper });
    await waitFor(() => expect(result.current).toBe(true));

    visitedAt(Date.parse('2026-08-14T12:00:00.000Z'));

    await waitFor(() => expect(result.current).toBe(false));
  });
});
