/**
 * LAB-2922: `/teams` renders page 1 into the server HTML, and the list hook shows that page as placeholder data:
 *   - in the server render and the hydrating render, whatever the filter store holds (covered by
 *     infinite-teams-list-server-render.test.tsx, which renders on the server);
 *   - afterwards only while the list's own query is the one the server fetched (here).
 * Any other set of filters must never be shown the server's teams.
 */
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useInfiniteTeamsList } from '@/services/teams/hooks/useInfiniteTeamsList';
import { buildTeamsListQuery, type ServerTeamsPage } from '@/services/teams/teamsListQuery';
import type { TeamsListQueryParams } from '@/services/teams/types';

// The browser's own fetch never lands in these tests: what shows is the placeholder or nothing.
const mockGetTeamList = jest.fn(() => new Promise(() => {}));
jest.mock('@/app/actions/teams.actions', () => ({ getTeamList: () => mockGetTeamList() }));
jest.mock('@/utils/third-party.helper', () => ({ getCookiesFromClient: () => ({ authToken: '' }) }));
jest.mock('@/components/core/ToastContainer', () => ({ toast: { error: jest.fn() } }));

const URL_FILTERS = { searchBy: 'lab' } as TeamsListQueryParams['searchParams'];
const SERVER_PAGE: ServerTeamsPage = {
  key: buildTeamsListQuery(URL_FILTERS),
  items: [{ id: 'team-1', name: 'Lab Team' } as never],
  total: 1,
  followingTotal: 0,
};

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => mockGetTeamList.mockClear());

it('shows the server page once the store holds the filters it was fetched for', async () => {
  const { result } = renderHook(
    () => useInfiniteTeamsList({ searchParams: URL_FILTERS }, { serverPage: SERVER_PAGE }),
    { wrapper },
  );

  expect(result.current.data.map((team) => team.name)).toEqual(['Lab Team']);
  expect(result.current.total).toBe(1);
  expect(result.current.isLoading).toBe(false);
  await waitFor(() => expect(mockGetTeamList).toHaveBeenCalled());
});

it('never shows the server page for other filters', () => {
  const { result } = renderHook(
    () => useInfiniteTeamsList({ searchParams: { searchBy: 'other' } as never }, { serverPage: SERVER_PAGE }),
    { wrapper },
  );

  expect(result.current.data).toEqual([]);
  expect(result.current.isLoading).toBe(true);
});
