import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';

import { PublishedAiAppPage } from '@/components/page/ai-apps/PublishedAiAppPage';
import type { PublishedAiApp } from '@/services/ai-apps/ai-apps.service';

const mockAnalytics = {
  onPublishedAppOpened: jest.fn(),
  onPublishedAppUnavailable: jest.fn(),
};
jest.mock('@/analytics/ai-apps.analytics', () => ({
  useAiAppsAnalytics: () => mockAnalytics,
}));

let mockPublished: { apps: PublishedAiApp[]; isLoading: boolean };
const mockUsePublishedAiApps = jest.fn();
jest.mock('@/services/ai-apps/hooks/usePublishedAiApps', () => ({
  usePublishedAiApps: (...args: unknown[]) => {
    mockUsePublishedAiApps(...args);
    return mockPublished;
  },
}));

// The page must work for a member without `ai_apps.read`: any call into the
// AI Apps catalog API (detail, liveness, view count) would be refused for them.
const mockCustomFetch = jest.fn();
jest.mock('@/utils/fetch-wrapper', () => ({
  customFetch: (...args: unknown[]) => mockCustomFetch(...args),
}));

const BASE_PATH = '/apps/cmplaybook1';
const APP_ORIGIN = 'https://playbook.os.pl.xyz';
let mockPathname = BASE_PATH;
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const playbook: PublishedAiApp = {
  uid: 'cmplaybook1',
  appId: 'playbook',
  name: 'PLaybook',
  description: null,
  url: APP_ORIGIN,
};

const renderPage = (uid = 'cmplaybook1') => render(<PublishedAiAppPage uid={uid} basePath={`/apps/${uid}`} />);

const frame = () => document.querySelector('iframe');

function postRoute(data: unknown, init: Partial<MessageEventInit> = {}) {
  act(() => {
    window.dispatchEvent(
      new MessageEvent('message', { data, origin: APP_ORIGIN, source: frame()?.contentWindow, ...init }),
    );
  });
}

describe('PublishedAiAppPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = BASE_PATH;
    mockPublished = { apps: [playbook], isLoading: false };
    window.history.replaceState(null, '', BASE_PATH);
    document.title = 'Protocol Labs Directory';
  });

  it('shows a loading state, and no frame, until the published list answers', () => {
    mockPublished = { apps: [], isLoading: true };

    renderPage();

    expect(screen.getByText('Loading app…')).toBeInTheDocument();
    expect(frame()).toBeNull();
    expect(mockAnalytics.onPublishedAppUnavailable).not.toHaveBeenCalled();
  });

  // The More menu may still list an app taken back a moment ago; the page must not frame it from that cache.
  it('asks for a fresh published list, not the one the menu cached', () => {
    renderPage();

    expect(mockUsePublishedAiApps).toHaveBeenCalledWith({ fresh: true });
  });

  describe('an app that is not published to the member', () => {
    it('says so, with a way back to Home rather than to the AI Apps catalog', () => {
      mockPublished = { apps: [playbook], isLoading: false };

      renderPage('cmsomeoneelse');

      expect(screen.getByRole('heading', { name: 'This app is not available to you' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/');
      expect(document.querySelector('a[href^="/pl-infra"]')).toBeNull();
      expect(frame()).toBeNull();
      expect(mockAnalytics.onPublishedAppUnavailable).toHaveBeenCalledTimes(1);
      expect(mockAnalytics.onPublishedAppUnavailable).toHaveBeenCalledWith('cmsomeoneelse');
    });

    it('reads an empty list — the request failed, or nothing is published — the same way', () => {
      mockPublished = { apps: [], isLoading: false };

      renderPage();

      expect(screen.getByText('This app is not available to you')).toBeInTheDocument();
      expect(frame()).toBeNull();
    });

    it('never frames a URL that is not http(s)', () => {
      mockPublished = { apps: [{ ...playbook, url: 'javascript:alert(1)' }], isLoading: false };

      renderPage();

      expect(screen.getByText('This app is not available to you')).toBeInTheDocument();
      expect(frame()).toBeNull();
    });
  });

  describe('a published app', () => {
    it('embeds the app full-area, with fullscreen allowed and no manager chrome', () => {
      renderPage();

      expect(frame()).toHaveAttribute('src', APP_ORIGIN);
      expect(frame()).toHaveAttribute('allow', 'fullscreen');
      expect(frame()).toHaveAttribute('title', 'PLaybook');
      expect(screen.queryByRole('link')).toBeNull();
      expect(screen.queryByRole('button')).toBeNull();
      expect(mockAnalytics.onPublishedAppOpened).toHaveBeenCalledTimes(1);
      expect(mockAnalytics.onPublishedAppOpened).toHaveBeenCalledWith('cmplaybook1', 'PLaybook', null);
    });

    it('calls nothing on the AI Apps API, which the member has no permission for', () => {
      renderPage();
      act(() => {
        frame()?.dispatchEvent(new Event('load'));
      });

      expect(mockCustomFetch).not.toHaveBeenCalled();
    });

    it('sets the tab title to the app name and restores it on unmount', () => {
      const { unmount } = renderPage();

      expect(document.title).toBe('PLaybook');
      unmount();
      expect(document.title).toBe('Protocol Labs Directory');
    });

    it('opens the app at the subpage and query named by the URL', () => {
      mockPathname = `${BASE_PATH}/reports/42`;
      window.history.replaceState(null, '', `${BASE_PATH}/reports/42?tab=weekly`);

      renderPage();

      expect(frame()).toHaveAttribute('src', `${APP_ORIGIN}/reports/42?tab=weekly`);
      expect(mockAnalytics.onPublishedAppOpened).toHaveBeenCalledWith('cmplaybook1', 'PLaybook', '/reports/42');
    });

    it('falls back to the app root when the segments do not form a path on the app origin', () => {
      mockPathname = `${BASE_PATH}//evil.com/x`;

      renderPage();

      expect(frame()).toHaveAttribute('src', APP_ORIGIN);
    });

    it('keeps a pasted OAuth code out of the frame and out of the address bar', () => {
      window.history.replaceState(null, '', `${BASE_PATH}?tab=weekly&code=live-auth-code`);

      renderPage();

      expect(frame()).toHaveAttribute('src', `${APP_ORIGIN}/?tab=weekly`);
      expect(window.location.search).toBe('?tab=weekly');
    });

    it('mirrors the route the app reports into the URL and tab title without reloading the frame', () => {
      renderPage();
      const initialSrc = frame()?.getAttribute('src');

      postRoute({ type: 'pln-ai-app:route', path: '/reports/42?tab=weekly&token=secret#frag', title: 'Reports' });

      expect(window.location.pathname).toBe(`${BASE_PATH}/reports/42`);
      expect(window.location.search).toBe('?tab=weekly');
      expect(window.location.hash).toBe('');
      expect(document.title).toBe('Reports · PLaybook');
      expect(frame()?.getAttribute('src')).toBe(initialSrc);

      postRoute({ type: 'pln-ai-app:route', path: '/', title: '' });

      expect(window.location.pathname).toBe(BASE_PATH);
      expect(document.title).toBe('PLaybook');
    });

    it('ignores a route report from another origin or another window', () => {
      renderPage();

      postRoute({ type: 'pln-ai-app:route', path: '/hijack', title: 'x' }, { origin: 'https://evil.example.com' });
      postRoute({ type: 'pln-ai-app:route', path: '/hijack', title: 'x' }, { source: window });

      expect(window.location.pathname).toBe(BASE_PATH);
      expect(document.title).toBe('PLaybook');
    });

    it('ignores a reported path that leaves the app origin', () => {
      renderPage();

      postRoute({ type: 'pln-ai-app:route', path: 'https://evil.example.com/x', title: '' });
      postRoute({ type: 'pln-ai-app:route', path: '//evil.example.com/x', title: '' });

      expect(window.location.pathname).toBe(BASE_PATH);
    });
  });
});
