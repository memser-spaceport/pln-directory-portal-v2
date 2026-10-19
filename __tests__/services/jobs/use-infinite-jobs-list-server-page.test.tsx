/**
 * LAB-2888: the board's server-fetched first page stands in until the client's own fetch lands — only for the
 * filters it was fetched for, and never written to the shared QueryClient cache.
 */
jest.unmock('@tanstack/react-query');

let mockSearch = '';
jest.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(mockSearch) }));

const mockFetchJobsList = jest.fn();
jest.mock('@/services/jobs/jobs.service', () => ({
  fetchJobsList: (...args: unknown[]) => mockFetchJobsList(...args),
  fetchJobsFilters: jest.fn(),
}));

import { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useInfiniteJobsList, type ServerJobsPage } from '@/services/jobs/hooks/useJobsQueries';
import type { IJobsListResponse } from '@/types/jobs.types';

const page = (teamUid: string): IJobsListResponse =>
  ({
    page: 1,
    limit: 50,
    total: 1,
    totalGroups: 1,
    totalRoles: 2,
    groups: [{ team: { uid: teamUid, name: teamUid }, roles: [], totalRoles: 2 }],
  }) as unknown as IJobsListResponse;

const setup = (serverPage?: ServerJobsPage) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, ...renderHook(() => useInfiniteJobsList(serverPage), { wrapper }) };
};

beforeEach(() => {
  mockFetchJobsList.mockReset();
  mockFetchJobsList.mockReturnValue(new Promise(() => {})); // the client fetch hasn't landed yet
});

it('shows the server page at once, without a loading state, for the filters it was fetched for', () => {
  mockSearch = 'roleCategory=Engineering';
  const { result } = setup({ key: 'roleCategory=Engineering', page: page('from-server') });

  expect(result.current.isLoading).toBe(false);
  expect(result.current.groups.map((g) => g.team.uid)).toEqual(['from-server']);
  expect(result.current.totalRoles).toBe(2);
});

it('ignores a server page fetched for other filters', () => {
  mockSearch = 'roleCategory=Design';
  const { result } = setup({ key: 'roleCategory=Engineering', page: page('from-server') });

  expect(result.current.isLoading).toBe(true);
  expect(result.current.groups).toEqual([]);
});

it('never writes the server page into the shared cache, and the client fetch replaces it', async () => {
  mockSearch = '';
  let resolve: (value: IJobsListResponse) => void = () => {};
  mockFetchJobsList.mockReturnValue(new Promise((r) => (resolve = r)));
  const { client, result } = setup({ key: '', page: page('from-server') });

  expect(client.getQueryCache().getAll()[0]?.state.data).toBeUndefined();

  resolve(page('from-client'));
  await waitFor(() => expect(result.current.groups.map((g) => g.team.uid)).toEqual(['from-client']));
});
