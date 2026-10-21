/**
 * LAB-2922: the teams list shows the server's page 1, with a link to each team profile, without waiting for the
 * filter values. Those only label the mobile filter sheet, and waiting for them kept the server-rendered list behind
 * the skeleton.
 */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { buildTeamsListQuery } from '@/services/teams/teamsListQuery';

// team.utils pulls in next/server, which needs a `Request` jsdom does not have.
jest.mock('next/server', () => ({ NextResponse: {}, NextRequest: class {} }));
jest.mock('@/app/actions/teams.actions', () => ({ getTeamList: () => new Promise(() => {}) }));
jest.mock('@/utils/third-party.helper', () => ({ getCookiesFromClient: () => ({ authToken: '' }) }));
jest.mock('@/app/teams/(teams-page)/hooks/useGetTeamsFilterValues', () => ({
  // Still loading: no filter values yet.
  useTeamsFilters: () => ({ filterValues: undefined, isLoading: true, isError: false }),
}));
jest.mock('@/hooks/teams/useGetTeamsFilterAsObjectFromStore', () => ({
  useGetTeamsFilterAsObjectFromStore: () => ({}),
}));
jest.mock('@/services/team-news/hooks/useTeamNewsCounts', () => ({
  useTeamNewsCounts: () => undefined,
  useTeamNewsCount: () => undefined,
}));
jest.mock('@/services/follow/hooks/useFollowingTeamsCount', () => ({ useFollowingTeamsCount: (n: number) => n }));
jest.mock('@/components/page/teams/TeamsToolbar', () => ({
  TeamsToolbar: ({ totalTeams }: { totalTeams: number }) => <div>{totalTeams} teams</div>,
}));
jest.mock('@/components/page/team-details/TeamNews', () => ({ TeamNewsModal: () => null }));
jest.mock('@/components/core/ToastContainer', () => ({ toast: { error: jest.fn() } }));

import TeamsContent from '@/app/teams/(teams-page)/@content/TeamsContent';

const SERVER_PAGE = {
  key: buildTeamsListQuery({} as never),
  items: [
    { id: 'team-1', name: 'Lab Team', shortDescription: 'Builds labs', industryTags: [], asks: [] },
    { id: 'team-2', name: 'Other Team', shortDescription: 'Builds others', industryTags: [], asks: [] },
  ] as never[],
  total: 2,
  followingTotal: 0,
};

it('shows the server page, linked to each profile, while the filter values are still loading', () => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <TeamsContent userInfo={undefined} isLoggedIn={false} serverPage={SERVER_PAGE} />
    </QueryClientProvider>,
  );

  expect(screen.getByText('2 teams')).toBeInTheDocument();
  expect(screen.getAllByRole('link', { name: /Lab Team/ })[0]).toHaveAttribute('href', '/teams/team-1');
  expect(screen.getAllByRole('link', { name: /Other Team/ })[0]).toHaveAttribute('href', '/teams/team-2');
});
