import '@testing-library/jest-dom';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';

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
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ replace: mockReplace }),
}));

// A member outside PL Infra unless a test says otherwise.
let mockPermissions: { permsSet: Set<string>; isLoading: boolean };
jest.mock('@/services/rbac/hooks/usePermissions', () => ({
  usePermissions: () => mockPermissions,
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
    mockPermissions = { permsSet: new Set(), isLoading: false };
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
      expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/home');
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
  describe('admin settings (LAB-3238)', () => {
    const pla: PublishedAiApp = {
      ...playbook,
      uid: 'cmpla1',
      appId: 'pla-portal',
      name: 'PLA',
      url: 'https://pla.os.pl.xyz',
      path: 'pla',
      hideTopNav: true,
      showInMore: false,
    };

    it('opens an app by its admin-set path, and still by its uid', () => {
      mockPublished = { apps: [pla], isLoading: false };

      renderPage('pla');
      expect(frame()?.getAttribute('src')).toBe('https://pla.os.pl.xyz');
      cleanup();

      renderPage('PLA');
      expect(frame()?.getAttribute('src')).toBe('https://pla.os.pl.xyz');
      cleanup();

      renderPage('cmpla1');
      expect(frame()?.getAttribute('src')).toBe('https://pla.os.pl.xyz');
    });

    it('opens an app hidden from More by its link', () => {
      mockPublished = { apps: [pla], isLoading: false };
      renderPage('pla');
      expect(frame()).not.toBeNull();
    });

    it('fills the whole page for an app that hides the LabOS top navigation', () => {
      mockPublished = { apps: [pla], isLoading: false };
      renderPage('pla');
      expect(document.querySelector('[class*="rootFullPage"]')).not.toBeNull();
    });

    it('leaves room for the header for an app that keeps it', () => {
      renderPage();
      expect(document.querySelector('[class*="rootFullPage"]')).toBeNull();
    });

    it('sends a PL Infra member outside the audience to the app in the catalog', async () => {
      mockPublished = { apps: [], isLoading: false };
      mockPermissions = { permsSet: new Set(['ai_apps.read']), isLoading: false };
      mockCustomFetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ uid: 'cmpla1' }) });

      renderPage('pla');

      await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/pl-infra/ai-apps/cmpla1'));
      expect(mockCustomFetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/v1\/ai-apps\/pla$/),
        { method: 'GET' },
        true,
      );
      expect(screen.queryByText('This app is not available to you')).toBeNull();
    });

    it('says "not available" to a PL Infra member when the catalog does not know the link either', async () => {
      mockPublished = { apps: [], isLoading: false };
      mockPermissions = { permsSet: new Set(['ai_apps.read']), isLoading: false };
      mockCustomFetch.mockResolvedValue({ ok: false, status: 404 });

      renderPage('nothing-here');

      expect(await screen.findByText('This app is not available to you')).toBeInTheDocument();
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });
});
