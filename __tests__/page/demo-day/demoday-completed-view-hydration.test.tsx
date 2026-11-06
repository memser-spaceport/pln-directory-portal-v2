/**
 * LAB-2930: the completed view's server HTML hydrates without a mismatch. Once the page rendered on the server, its
 * rich-text description (already wrapped in its own <p>s) sat inside a <p>: the HTML parser splits nested paragraphs,
 * so React found a different tree, threw the server markup away and rendered the page again in the browser. A team
 * card's news badge did the same: a link inside the card's link. jsdom's parser splits both the same way.
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

import '@testing-library/jest-dom';
import { act } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { DemodayCompletedView } from '@/components/page/demo-day/DemodayCompletedView';
import type { DemoDayState } from '@/app/actions/demo-day.actions';

// The Node build, which the server runs; jsdom would resolve the browser build, which needs MessageChannel.
const { renderToString } = require('react-dom/server.node');

const demoDay = {
  uid: 'demo-day-1',
  slugURL: 'plw26',
  status: 'COMPLETED',
  access: 'none',
  title: 'Protocol Labs Demo Day W26',
  // Rich text, as the back office stores it.
  description: '<p>Twenty teams across AI, crypto and neurotech.</p>',
  date: '2026-03-16T16:00:00.000Z',
  teamsCount: 1,
  investorsCount: 0,
  // A team with news: its card links to the profile and, inside that link, to the profile's news.
  teams: [{ uid: 'team-1', name: 'Radicle', logoUrl: null, newsCount: 3, shortDescription: '', isFollowing: false }],
} as unknown as DemoDayState;

it('hydrates the server HTML without a mismatch', async () => {
  const page = <DemodayCompletedView initialDemoDayState={demoDay} isLoggedIn={false} />;
  const container = document.createElement('div');
  container.innerHTML = renderToString(page);
  document.body.appendChild(container);
  const onRecoverableError = jest.fn();
  jest.spyOn(console, 'error').mockImplementation(() => undefined);

  await act(async () => {
    hydrateRoot(container, page, { onRecoverableError });
  });

  expect(onRecoverableError).not.toHaveBeenCalled();
  expect(container.querySelector('h1')).toHaveTextContent('Protocol Labs Demo Day W26');
});
