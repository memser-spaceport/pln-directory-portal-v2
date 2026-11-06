/**
 * @jest-environment node
 */
/**
 * LAB-2930: a finished Demo Day's completed view is in the server HTML. It used to return its loading skeleton while
 * the list of all Demo Days loaded, and on the server that list is always still loading, so crawlers got the same
 * empty skeleton on every completed page. That list only picks the next Demo Day for the apply modal. Rendered here as
 * the server renders it: no DOM, and every client query still pending.
 */
jest.mock('next/navigation', () => ({
  useParams: () => ({ demoDayId: 'plw26' }),
  usePathname: () => '/demoday/plw26/completed',
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn(), prefetch: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock('@/services/demo-day/hooks/useGetDemoDaysList', () => ({
  useGetDemoDaysList: () => ({ data: undefined, isLoading: true }),
}));
jest.mock('@/services/demo-day/hooks/useGetFundraisingProfile', () => ({
  useGetFundraisingProfile: () => ({ data: undefined, isLoading: true }),
}));
jest.mock('@/analytics/demoday.analytics', () => ({
  useDemoDayAnalytics: () => new Proxy({}, { get: () => jest.fn() }),
}));
jest.mock('@/hooks/usePageViewAnalytics', () => ({ useDemoDayPageViewAnalytics: jest.fn() }));
jest.mock('@/components/common/LogosGrid', () => ({ LogosGrid: () => null }));
// The card is covered by its own suite; here the subject is whether the teams reach the server HTML at all.
jest.mock(
  '@/components/page/demo-day/DemodayCompletedView/components/CompletedDemoDayTeamsList/components/PastTeamCard',
  () => ({
    PastTeamCard: ({ team }: { team: { uid: string; name: string } }) => <a href={`/teams/${team.uid}`}>{team.name}</a>,
  }),
);

import { renderToString } from 'react-dom/server';
import { DemodayCompletedView } from '@/components/page/demo-day/DemodayCompletedView';
import type { DemoDayState } from '@/app/actions/demo-day.actions';

const demoDay = {
  uid: 'demo-day-1',
  slugURL: 'plw26',
  status: 'COMPLETED',
  access: 'none',
  title: 'Protocol Labs Demo Day W26',
  // Rich text, as the back office stores it.
  description: '<p>Twenty teams across AI, crypto and neurotech.</p>',
  date: '2026-03-16T16:00:00.000Z',
  teamsCount: 2,
  investorsCount: 0,
  teams: [
    { uid: 'team-1', name: 'Radicle', logoUrl: null, newsCount: 0, shortDescription: '', isFollowing: false },
    { uid: 'team-2', name: 'Spexi', logoUrl: null, newsCount: 0, shortDescription: '', isFollowing: false },
  ],
} as unknown as DemoDayState;

it("renders the Demo Day's name, description and teams on the server, while the client queries are pending", () => {
  const html = renderToString(<DemodayCompletedView initialDemoDayState={demoDay} isLoggedIn={false} />);

  expect(html).toMatch(/<h1[^>]*>Protocol Labs Demo Day W26<\/h1>/);
  expect(html).toContain('Twenty teams across AI, crypto and neurotech.');
  // A <p> around the description's own <p>s can't survive the HTML parser, and fails hydration.
  expect(html).not.toMatch(/<p[^>]*><p>/);
  expect(html).toContain('Participating teams (<!-- -->2<!-- -->)');
  expect(html).toContain('href="/teams/team-1"');
  expect(html).toContain('href="/teams/team-2"');
});
