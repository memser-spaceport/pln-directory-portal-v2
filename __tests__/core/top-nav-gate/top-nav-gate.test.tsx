import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { publishedAppSegmentOf, TopNavGate } from '@/components/core/TopNavGate';
import type { PublishedAiApp } from '@/services/ai-apps/ai-apps.service';

let mockPathname = '/home';
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

let mockPublished: { apps: PublishedAiApp[]; isLoading: boolean };
jest.mock('@/services/ai-apps/hooks/usePublishedAiApps', () => ({
  usePublishedAiApps: () => mockPublished,
}));

const app = (overrides: Partial<PublishedAiApp> = {}): PublishedAiApp => ({
  uid: 'cmhello1',
  appId: 'hello',
  name: 'Hello',
  description: null,
  url: 'https://hello.os.pl.xyz',
  path: 'hello',
  hideTopNav: false,
  ...overrides,
});

const renderGate = () =>
  render(
    <TopNavGate>
      <header>LabOS header</header>
    </TopNavGate>,
  );
const header = () => screen.queryByText('LabOS header');

describe('TopNavGate', () => {
  beforeEach(() => {
    mockPathname = '/home';
    mockPublished = { apps: [], isLoading: false };
  });

  it('renders the header on every route that is not a published app, even while the list loads', () => {
    mockPublished = { apps: [], isLoading: true };
    renderGate();
    expect(header()).toBeInTheDocument();
  });

  // LAB-3335: the header must never show first and then disappear.
  it('leaves the header out of /apps/… until the published list answers', () => {
    mockPathname = '/apps/hello';
    mockPublished = { apps: [], isLoading: true };
    renderGate();
    expect(header()).toBeNull();
  });

  it('leaves it out for an app that hides the top navigation, by path or by uid', () => {
    mockPublished = { apps: [app({ hideTopNav: true })], isLoading: false };

    mockPathname = '/apps/hello/reports';
    const { unmount } = renderGate();
    expect(header()).toBeNull();
    unmount();

    mockPathname = '/apps/cmhello1';
    renderGate();
    expect(header()).toBeNull();
  });

  it('renders it for an app that keeps the top navigation, and for a link the list does not know', () => {
    mockPublished = { apps: [app()], isLoading: false };

    mockPathname = '/apps/hello';
    const { unmount } = renderGate();
    expect(header()).toBeInTheDocument();
    unmount();

    mockPathname = '/apps/unknown';
    renderGate();
    expect(header()).toBeInTheDocument();
  });
});

describe('publishedAppSegmentOf', () => {
  it.each([
    ['/apps/hello', 'hello'],
    ['/apps/hello/reports/q3', 'hello'],
    ['/apps/cmhello1', 'cmhello1'],
    ['/apps/', null],
    ['/home', null],
    ['/pl-infra/ai-apps/cmhello1', null],
    [null, null],
  ])('%p → %p', (pathname, expected) => {
    expect(publishedAppSegmentOf(pathname)).toBe(expected);
  });
});
