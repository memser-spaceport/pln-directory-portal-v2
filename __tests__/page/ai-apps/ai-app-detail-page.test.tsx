import '@testing-library/jest-dom';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';

import { AiAppDetailPage } from '@/components/page/ai-apps/AiAppDetailPage';
import { AiApp, recordAiAppView } from '@/services/ai-apps/ai-apps.service';

const mockAnalytics = {
  onDetailPageViewed: jest.fn(),
  onDraftSetupViewed: jest.fn(),
  onIframeLoadFailed: jest.fn(),
  onIframeLoaded: jest.fn(),
  onDeploymentLogsOpened: jest.fn(),
};

let mockUseAiAppReturn: { app: AiApp | null; isLoading: boolean; isError: boolean };

jest.mock('@/services/ai-apps/hooks/useAiApp', () => ({
  useAiApp: () => mockUseAiAppReturn,
}));

jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => ({ currentUser: { uid: 'member-1' } }),
}));

jest.mock('@/services/ai-apps/ai-apps.service', () => ({
  ...jest.requireActual('@/services/ai-apps/ai-apps.service'),
  checkAiAppLive: jest.fn().mockResolvedValue(true),
  recordAiAppView: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/analytics/ai-apps.analytics', () => ({
  useAiAppsAnalytics: () => mockAnalytics,
}));

jest.mock('@/components/page/ai-apps/components/FloatingFeedbackButton', () => ({
  FloatingFeedbackButton: () => null,
}));

// AppSecretsPanel's own behavior is covered by the mandatory-setup-card path
// only, which this feature doesn't change — a bare stub is enough here.
jest.mock('@/components/page/ai-apps/AiAppDetailPage/components/AppSecretsPanel', () => ({
  AppSecretsPanel: () => <div>AppSecretsPanel</div>,
}));

const mockCanLikelyManage = jest.fn();
jest.mock('@/services/ai-apps/hooks/useAiAppManageAccess', () => ({
  useAiAppManageAccess: () => ({ canLikelyManage: mockCanLikelyManage, isDirectoryAdmin: false }),
}));

jest.mock('@/components/page/ai-apps/AiAppsPage/components/AppActionsMenu', () => ({
  AppActionsMenu: ({
    onEdit,
    onDeployment,
    onDelete,
  }: {
    onEdit: () => void;
    onDeployment: () => void;
    onDelete: () => void;
  }) => (
    <div>
      <span>AppActionsMenu</span>
      <button onClick={onEdit}>Edit details</button>
      <button onClick={onDeployment}>Deployment settings</button>
      <button onClick={onDelete}>Delete app</button>
    </div>
  ),
}));

jest.mock('@/components/page/ai-apps/dynamicActionModals', () => ({
  EditAiAppModal: ({ onClose }: { onClose: () => void }) => (
    <div>
      <span>EditAiAppModal</span>
      <button onClick={onClose}>Close edit</button>
    </div>
  ),
  DeploymentSettingsModal: ({
    onClose,
    onDeployingChange,
  }: {
    onClose: () => void;
    onDeployingChange?: (deploying: boolean) => void;
  }) => (
    <div>
      <span>DeploymentSettingsModal</span>
      <button onClick={() => onDeployingChange?.(true)}>Start redeploy</button>
      <button onClick={() => onDeployingChange?.(false)}>Finish redeploy</button>
      <button onClick={onClose}>Close deployment</button>
    </div>
  ),
  DeleteAiAppDialog: ({ onClose, onDeleteSucceeded }: { onClose: () => void; onDeleteSucceeded?: () => void }) => (
    <div>
      <span>DeleteAiAppDialog</span>
      <button
        onClick={() => {
          onDeleteSucceeded?.();
          onClose();
        }}
      >
        Confirm delete
      </button>
      <button onClick={onClose}>Cancel delete</button>
    </div>
  ),
  AiAppDetailsModal: ({ onClose }: { onClose: () => void }) => (
    <div>
      <span>AiAppDetailsModal</span>
      <button onClick={onClose}>Close details</button>
    </div>
  ),
  DeploymentLogsModal: ({ onClose }: { onClose: () => void }) => (
    <div>
      <span>DeploymentLogsModal</span>
      <button onClick={onClose}>Close logs</button>
    </div>
  ),
}));

const mockPush = jest.fn();
let mockSearchParams = new URLSearchParams();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => '/pl-infra/ai-apps/app-1',
  useSearchParams: () => mockSearchParams,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function buildApp(overrides: Partial<AiApp> = {}): AiApp {
  return {
    uid: 'app-1',
    memberUid: 'member-1',
    appId: 'news-summarizer',
    name: 'News Summarizer',
    description: 'Summarize recent news.',
    status: 'READY',
    notes: null,
    url: 'https://sandbox.example.com/app-1',
    httpUrl: 'https://sandbox.example.com/app-1',
    host: 'sandbox.example.com',
    port: 443,
    deploymentId: 'deploy-1',
    requiredEnvVars: ['PERPLEXITY_API_KEY'],
    providedEnvVars: ['PERPLEXITY_API_KEY'],
    canManage: true,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    member: { uid: 'member-1', name: 'Ada', image: null },
    ...overrides,
  };
}

describe('AiAppDetailPage', () => {
  beforeEach(() => {
    mockCanLikelyManage.mockReturnValue(true);
    mockSearchParams = new URLSearchParams();
    document.title = 'AI Apps | Protocol Labs Directory';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('document title', () => {
    it('sets the tab title to the app name after load and restores it on unmount', () => {
      mockUseAiAppReturn = { app: buildApp(), isLoading: false, isError: false };
      const { unmount } = render(<AiAppDetailPage uid="app-1" />);

      expect(document.title).toBe('News Summarizer');
      unmount();
      expect(document.title).toBe('AI Apps | Protocol Labs Directory');
    });

    it('does not overwrite the tab title while the app is still loading', () => {
      mockUseAiAppReturn = { app: null, isLoading: true, isError: false };
      render(<AiAppDetailPage uid="app-1" />);

      expect(document.title).toBe('AI Apps | Protocol Labs Directory');
    });

    it('does not overwrite the tab title when the app name is blank', () => {
      mockUseAiAppReturn = { app: buildApp({ name: '   ' }), isLoading: false, isError: false };
      render(<AiAppDetailPage uid="app-1" />);

      expect(document.title).toBe('AI Apps | Protocol Labs Directory');
    });
  });

  it('renders the centered setup card for a DRAFT app, with no top bar', () => {
    mockUseAiAppReturn = { app: buildApp({ status: 'DRAFT', providedEnvVars: [] }), isLoading: false, isError: false };

    render(<AiAppDetailPage uid="app-1" />);

    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('AppSecretsPanel')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^back$/i })).not.toBeInTheDocument();
  });

  describe('healthy app top bar', () => {
    it('renders "Back" pointing at the list route', () => {
      mockUseAiAppReturn = { app: buildApp(), isLoading: false, isError: false };
      render(<AiAppDetailPage uid="app-1" />);

      expect(screen.getByRole('link', { name: /^back$/i })).toHaveAttribute('href', '/pl-infra/ai-apps');
    });

    it('shows "App Details" only when the app has a one-pager, and opens the details modal', () => {
      mockUseAiAppReturn = {
        app: buildApp({ prd: 'https://bucket.s3.amazonaws.com/ai-app-prds/app-1.md' }),
        isLoading: false,
        isError: false,
      };
      render(<AiAppDetailPage uid="app-1" />);

      const detailsButton = screen.getByRole('button', { name: /app details for news summarizer/i });
      fireEvent.click(detailsButton);
      expect(screen.getByText('AiAppDetailsModal')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Close details'));
      expect(screen.queryByText('AiAppDetailsModal')).not.toBeInTheDocument();
    });

    it('hides "App Details" when the app has no one-pager', () => {
      mockUseAiAppReturn = { app: buildApp({ prd: null }), isLoading: false, isError: false };
      render(<AiAppDetailPage uid="app-1" />);

      expect(screen.queryByRole('button', { name: /app details/i })).not.toBeInTheDocument();
    });

    it('shows the manage menu only when canLikelyManage is true', () => {
      mockUseAiAppReturn = { app: buildApp(), isLoading: false, isError: false };
      mockCanLikelyManage.mockReturnValue(false);
      render(<AiAppDetailPage uid="app-1" />);

      expect(screen.queryByText('AppActionsMenu')).not.toBeInTheDocument();
    });

    it('opens EditAiAppModal / DeploymentSettingsModal / DeleteAiAppDialog from the manage menu', () => {
      mockUseAiAppReturn = { app: buildApp(), isLoading: false, isError: false };
      render(<AiAppDetailPage uid="app-1" />);

      fireEvent.click(screen.getByText('Edit details'));
      expect(screen.getByText('EditAiAppModal')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Close edit'));
      expect(screen.queryByText('EditAiAppModal')).not.toBeInTheDocument();

      fireEvent.click(screen.getByText('Deployment settings'));
      expect(screen.getByText('DeploymentSettingsModal')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Close deployment'));
      expect(screen.queryByText('DeploymentSettingsModal')).not.toBeInTheDocument();

      fireEvent.click(screen.getByText('Delete app'));
      expect(screen.getByText('DeleteAiAppDialog')).toBeInTheDocument();
    });

    it('navigates to the AI Apps list once delete succeeds, not on cancel', () => {
      mockUseAiAppReturn = { app: buildApp(), isLoading: false, isError: false };
      render(<AiAppDetailPage uid="app-1" />);

      fireEvent.click(screen.getByText('Delete app'));
      fireEvent.click(screen.getByText('Cancel delete'));
      expect(mockPush).not.toHaveBeenCalled();

      fireEvent.click(screen.getByText('Delete app'));
      fireEvent.click(screen.getByText('Confirm delete'));
      expect(mockPush).toHaveBeenCalledWith('/pl-infra/ai-apps');
    });

    it('starting a redeploy from the menu does not swap the page into the mandatory "Deploying" card', () => {
      mockUseAiAppReturn = { app: buildApp(), isLoading: false, isError: false };
      const { rerender } = render(<AiAppDetailPage uid="app-1" />);

      fireEvent.click(screen.getByText('Deployment settings'));
      fireEvent.click(screen.getByText('Start redeploy'));

      // Simulate the page's own poll observing the backend flip to DEPLOYING —
      // without the onDeployingChange fix, this would unmount the modal below.
      mockUseAiAppReturn = { app: buildApp({ status: 'DEPLOYING' }), isLoading: false, isError: false };
      rerender(<AiAppDetailPage uid="app-1" />);

      expect(screen.getByText('DeploymentSettingsModal')).toBeInTheDocument();
      expect(screen.queryByText('Deploying')).not.toBeInTheDocument();
      expect(screen.getByText('Redeploying the app')).toBeInTheDocument();
    });
  });

  describe('deploy-failure states', () => {
    const WARNING_APP = () => buildApp({ status: 'ERROR', deployment: { serving: 'previous' }, notes: 'boom' });
    const DANGER_APP = () => buildApp({ status: 'ERROR', deployment: { serving: 'none' }, notes: 'boom' });
    const VISITOR = { canManage: false, member: { uid: 'member-2', name: 'Grace', image: null } } as const;

    it('warning (previous still serving), creator: normal layout with banner; See logs opens the modal', () => {
      mockUseAiAppReturn = { app: WARNING_APP(), isLoading: false, isError: false };
      render(<AiAppDetailPage uid="app-1" />);

      // Normal layout, not the setup card.
      expect(screen.getByRole('link', { name: /^back$/i })).toBeInTheDocument();
      expect(screen.queryByText('AppSecretsPanel')).not.toBeInTheDocument();
      expect(screen.getByText("Latest deploy didn't ship")).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /see logs/i }));
      expect(screen.getByText('DeploymentLogsModal')).toBeInTheDocument();
      expect(mockAnalytics.onDeploymentLogsOpened).toHaveBeenCalledWith({
        appUid: 'app-1',
        appName: 'News Summarizer',
        source: 'detail-banner',
        variant: 'warning',
      });
    });

    it('warning, visitor: normal layout with no banner and no See logs', () => {
      mockCanLikelyManage.mockReturnValue(false);
      mockUseAiAppReturn = {
        app: buildApp({ status: 'ERROR', deployment: { serving: 'previous' }, ...VISITOR }),
        isLoading: false,
        isError: false,
      };
      render(<AiAppDetailPage uid="app-1" />);

      expect(screen.getByRole('link', { name: /^back$/i })).toBeInTheDocument();
      expect(screen.queryByText("Latest deploy didn't ship")).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /see logs/i })).not.toBeInTheDocument();
    });

    it('danger (nothing serving), creator: setup card keeps notes + retry and gains See logs', () => {
      mockUseAiAppReturn = { app: DANGER_APP(), isLoading: false, isError: false };
      render(<AiAppDetailPage uid="app-1" />);

      expect(screen.getByText('Deploy failed')).toBeInTheDocument();
      expect(screen.getByText(/Last deploy failed: boom/)).toBeInTheDocument();
      expect(screen.getByText('AppSecretsPanel')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /see logs/i }));
      expect(screen.getByText('DeploymentLogsModal')).toBeInTheDocument();
      expect(mockAnalytics.onDeploymentLogsOpened).toHaveBeenCalledWith({
        appUid: 'app-1',
        appName: 'News Summarizer',
        source: 'detail-error-card',
        variant: 'danger',
      });
    });

    it('danger, non-manager: "Not deployed" placeholder with no failure details', () => {
      mockCanLikelyManage.mockReturnValue(false);
      mockUseAiAppReturn = {
        app: buildApp({ status: 'ERROR', deployment: { serving: 'none' }, notes: 'boom', ...VISITOR }),
        isLoading: false,
        isError: false,
      };
      render(<AiAppDetailPage uid="app-1" />);

      expect(screen.getByText('Not deployed')).toBeInTheDocument();
      expect(screen.getByText(/never been built successfully/)).toBeInTheDocument();
      expect(screen.queryByText(/Last deploy failed/)).not.toBeInTheDocument();
      expect(screen.queryByText('boom')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /see logs/i })).not.toBeInTheDocument();
    });

    it('legacy ERROR (no deployment info) still routes to the setup card; notes stay creator-only', () => {
      mockUseAiAppReturn = { app: buildApp({ status: 'ERROR', notes: 'boom' }), isLoading: false, isError: false };
      const { unmount } = render(<AiAppDetailPage uid="app-1" />);

      expect(screen.getByText('Deploy failed')).toBeInTheDocument();
      expect(screen.getByText(/Last deploy failed: boom/)).toBeInTheDocument();
      unmount();

      mockCanLikelyManage.mockReturnValue(false);
      mockUseAiAppReturn = {
        app: buildApp({ status: 'ERROR', notes: 'boom', ...VISITOR }),
        isLoading: false,
        isError: false,
      };
      render(<AiAppDetailPage uid="app-1" />);

      expect(screen.getByText(/The last deploy of this app failed/)).toBeInTheDocument();
      expect(screen.queryByText(/boom/)).not.toBeInTheDocument();
    });

    it('the warning banner hides during the creator’s own redeploy, and a warning→danger settle keeps the settings modal mounted', () => {
      mockUseAiAppReturn = { app: WARNING_APP(), isLoading: false, isError: false };
      const { rerender } = render(<AiAppDetailPage uid="app-1" />);

      fireEvent.click(screen.getByText('Deployment settings'));
      fireEvent.click(screen.getByText('Start redeploy'));
      expect(screen.queryByText("Latest deploy didn't ship")).not.toBeInTheDocument();

      // The redeploy settles ERROR with nothing serving: the page branch flips
      // to the setup card — the open modal must survive the flip (hoisted
      // modals regression guard).
      mockUseAiAppReturn = { app: DANGER_APP(), isLoading: false, isError: false };
      rerender(<AiAppDetailPage uid="app-1" />);

      expect(screen.getByText('DeploymentSettingsModal')).toBeInTheDocument();
    });

    it('ignores the ?settings=deployment deep link for non-managers', () => {
      mockSearchParams = new URLSearchParams('settings=deployment');
      mockCanLikelyManage.mockReturnValue(false);
      mockUseAiAppReturn = { app: buildApp(VISITOR), isLoading: false, isError: false };
      const { unmount } = render(<AiAppDetailPage uid="app-1" />);

      expect(screen.queryByText('DeploymentSettingsModal')).not.toBeInTheDocument();
      unmount();

      mockUseAiAppReturn = { app: buildApp(), isLoading: false, isError: false };
      render(<AiAppDetailPage uid="app-1" />);
      expect(screen.getByText('DeploymentSettingsModal')).toBeInTheDocument();
    });
  });

  describe('iframe view recording', () => {
    it('posts a view once when the iframe loads', async () => {
      mockUseAiAppReturn = { app: buildApp(), isLoading: false, isError: false };
      render(<AiAppDetailPage uid="app-1" />);

      const iframe = await waitFor(() => {
        const el = document.querySelector('iframe');
        if (!el) throw new Error('iframe not mounted');
        return el;
      });

      fireEvent.load(iframe);
      fireEvent.load(iframe);

      expect(recordAiAppView).toHaveBeenCalledTimes(1);
      expect(recordAiAppView).toHaveBeenCalledWith('app-1');
      expect(mockAnalytics.onIframeLoaded).toHaveBeenCalledTimes(1);
    });
  });

  describe('app subpage deep link', () => {
    const APP_ORIGIN = 'https://sandbox.example.com';

    async function mountIframe() {
      return waitFor(() => {
        const el = document.querySelector('iframe');
        if (!el) throw new Error('iframe not mounted');
        return el;
      });
    }

    function postRoute(iframe: HTMLIFrameElement, data: unknown, init: Partial<MessageEventInit> = {}) {
      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', { data, origin: APP_ORIGIN, source: iframe.contentWindow, ...init }),
        );
      });
    }

    beforeEach(() => {
      window.history.replaceState(null, '', '/pl-infra/ai-apps/app-1');
      mockUseAiAppReturn = { app: buildApp(), isLoading: false, isError: false };
    });

    it('opens the app at the ?path subpage', async () => {
      mockSearchParams = new URLSearchParams('path=%2Freports%2F42');
      render(<AiAppDetailPage uid="app-1" />);

      const iframe = await mountIframe();
      expect(iframe.getAttribute('src')).toBe(`${APP_ORIGIN}/reports/42`);
      expect(mockAnalytics.onDetailPageViewed).toHaveBeenCalledWith('app-1', 'News Summarizer', '/reports/42');
    });

    it.each(['//evil.com/x', 'https://evil.com', 'javascript:alert(1)'])(
      'falls back to the app root for a ?path outside the app origin (%s)',
      async (path) => {
        mockSearchParams = new URLSearchParams({ path });
        render(<AiAppDetailPage uid="app-1" />);

        const iframe = await mountIframe();
        expect(iframe.getAttribute('src')).toBe('https://sandbox.example.com/app-1');
        expect(mockAnalytics.onDetailPageViewed).toHaveBeenCalledWith('app-1', 'News Summarizer', null);
      },
    );

    it('mirrors the reported route and title into the URL and tab title without reloading the frame', async () => {
      render(<AiAppDetailPage uid="app-1" />);
      const iframe = await mountIframe();
      const initialSrc = iframe.getAttribute('src');

      postRoute(iframe, { type: 'pln-ai-app:route', path: '/reports/42?tab=a#x', title: 'Reports' });

      expect(window.location.search).toBe(`?path=${encodeURIComponent('/reports/42?tab=a#x')}`);
      expect(document.title).toBe('Reports · News Summarizer');
      expect(iframe.getAttribute('src')).toBe(initialSrc);

      postRoute(iframe, { type: 'pln-ai-app:route', path: '/', title: '' });

      expect(window.location.search).toBe('');
      expect(document.title).toBe('News Summarizer');
      expect(document.querySelector('iframe')?.getAttribute('src')).toBe(initialSrc);
    });

    it('ignores messages from another origin, another window, or of another type', async () => {
      render(<AiAppDetailPage uid="app-1" />);
      const iframe = await mountIframe();

      postRoute(iframe, { type: 'pln-ai-app:route', path: '/a', title: 'A' }, { origin: 'https://evil.com' });
      postRoute(iframe, { type: 'pln-ai-app:route', path: '/b', title: 'B' }, { source: window });
      postRoute(iframe, { type: 'other', path: '/c', title: 'C' });

      expect(window.location.search).toBe('');
      expect(document.title).toBe('News Summarizer');
    });

    it('reopens the last reported subpage when the frame remounts after a deploy', async () => {
      const { rerender } = render(<AiAppDetailPage uid="app-1" />);
      const iframe = await mountIframe();

      postRoute(iframe, { type: 'pln-ai-app:route', path: '/reports/42', title: 'Reports' });

      mockUseAiAppReturn = {
        app: buildApp({ lastDeployedAt: '2026-08-01T00:00:00.000Z' }),
        isLoading: false,
        isError: false,
      };
      rerender(<AiAppDetailPage uid="app-1" />);

      const remounted = await mountIframe();
      expect(remounted).not.toBe(iframe);
      expect(remounted.getAttribute('src')).toBe(`${APP_ORIGIN}/reports/42`);
    });
  });
});
