/**
 * @jest-environment node
 */
/**
 * LAB-2922: on the server, and in the hydrating render that must match it, the teams list shows the server's page 1
 * whatever the filter store holds. The store is still empty then: the URL sync fills it in a layout effect.
 */
import type { ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useInfiniteTeamsList } from '@/services/teams/hooks/useInfiniteTeamsList';
import { buildTeamsListQuery, type ServerTeamsPage } from '@/services/teams/teamsListQuery';
import type { TeamsListQueryParams } from '@/services/teams/types';

jest.mock('@/app/actions/teams.actions', () => ({ getTeamList: jest.fn() }));
jest.mock('@/utils/third-party.helper', () => ({ getCookiesFromClient: () => ({ authToken: '' }) }));
jest.mock('@/components/core/ToastContainer', () => ({ toast: { error: jest.fn() } }));

const SERVER_PAGE: ServerTeamsPage = {
  key: buildTeamsListQuery({ searchBy: 'lab' } as TeamsListQueryParams['searchParams']),
  items: [{ id: 'team-1', name: 'Lab Team' } as never],
  total: 1,
  followingTotal: 0,
};

function Wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;
}

function TeamNames() {
  // The filter store as the server and the hydrating render see it: empty.
  const { data } = useInfiniteTeamsList({ searchParams: {} as never }, { serverPage: SERVER_PAGE });
  return <p>{data.map((team) => team.name).join(', ') || 'no teams'}</p>;
}

it('renders the server page while the filter store is still empty', () => {
  const html = renderToString(
    <Wrapper>
      <TeamNames />
    </Wrapper>,
  );

  expect(html).toContain('Lab Team');
});
