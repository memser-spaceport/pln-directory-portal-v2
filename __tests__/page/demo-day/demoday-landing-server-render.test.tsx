/**
 * @jest-environment node
 */
/**
 * LAB-2930: a Demo Day's landing page is in the server HTML. It handed its server-fetched state to the query as
 * initialData, but DemoDayStats in the root layout reads the same query first, which drops initialData; the page then
 * rendered its loading skeleton on the server and until the browser fetched. Rendered here as the server renders it,
 * with the real React Query and the layout's reader mounted first.
 */
jest.mock('@tanstack/react-query', () => jest.requireActual('@tanstack/react-query'));
jest.mock('next/navigation', () => ({
  useParams: () => ({ demoDayId: 'pl-demo-day-june' }),
  usePathname: () => '/demoday/pl-demo-day-june',
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn(), prefetch: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock('@/analytics/demoday.analytics', () => ({
  useDemoDayAnalytics: () => new Proxy({}, { get: () => jest.fn() }),
}));
jest.mock('@/hooks/usePageViewAnalytics', () => ({ useDemoDayPageViewAnalytics: jest.fn() }));
jest.mock('@/hooks/useTimeOnPage', () => ({ useTimeOnPage: jest.fn() }));
jest.mock('@/services/demo-day/hooks/useReportAnalyticsEvent', () => ({
  useReportAnalyticsEvent: () => ({ mutate: jest.fn() }),
}));
jest.mock('@/components/core/navbar/components/LoginBtn', () => ({
  LoginBtn: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}));
jest.mock('@/components/common/LogosGrid', () => ({ LogosGrid: () => null }));
jest.mock('@/components/page/demo-day/ApplyForDemoDayModal', () => ({ ApplyForDemoDayModal: () => null }));
jest.mock('@/components/page/demo-day/AppliedInvestorSteps', () => ({ AppliedInvestorSteps: () => null }));

import React from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Landing } from '@/components/page/demo-day/Landing';
import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';
import type { DemoDayState } from '@/app/actions/demo-day.actions';

const demoDay = {
  uid: 'demo-day-2',
  slugURL: 'pl-demo-day-june',
  status: 'REGISTRATION_OPEN',
  access: 'none',
  title: 'PL Demo Day June',
  // Rich text, as the back office stores it.
  description: '<p>Early-stage teams from across the network.</p>',
  date: '2026-11-20T16:00:00.000Z',
  teamsCount: 12,
  investorsCount: 40,
  isDemoDayAdmin: false,
  confidentialityAccepted: false,
} as DemoDayState;

// DemoDayStats, in the root layout, reads the Demo Day state with no data before the page renders.
function LayoutReader() {
  useGetDemoDayState();
  return null;
}

function renderOnServer() {
  return renderToString(
    <QueryClientProvider client={new QueryClient()}>
      <LayoutReader />
      <Landing initialDemoDayState={demoDay} />
    </QueryClientProvider>,
  );
}

it("renders the Demo Day's name and description on the server, after the layout read the query", () => {
  const html = renderOnServer();

  expect(html).not.toContain('skeleton');
  expect(html).toMatch(/<h1[^>]*>PL Demo Day June<\/h1>/);
  expect(html).toContain('Early-stage teams from across the network.');
  // A <p> around the description's own <p>s can't survive the HTML parser, and fails hydration.
  expect(html).not.toMatch(/<p[^>]*><p>/);
});

it('leaves the countdown to the browser, where it can count from the current time', () => {
  const html = renderOnServer();

  // The page itself rendered, or a skeleton would pass this for the wrong reason.
  expect(html).toMatch(/<h1[^>]*>PL Demo Day June<\/h1>/);
  expect(html).not.toContain('Demo Day unlocks in');
});
