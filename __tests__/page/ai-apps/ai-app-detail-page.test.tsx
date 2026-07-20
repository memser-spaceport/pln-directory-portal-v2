import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';

import { AiAppDetailPage } from '@/components/page/ai-apps/AiAppDetailPage';
import { AiApp } from '@/services/ai-apps/ai-apps.service';

const mockAnalytics = {
  onDetailPageViewed: jest.fn(),
  onDraftSetupViewed: jest.fn(),
  onIframeLoadFailed: jest.fn(),
  onIframeLoaded: jest.fn(),
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
  DeleteAiAppDialog: ({
    onClose,
    onDeleteSucceeded,
  }: {
    onClose: () => void;
    onDeleteSucceeded?: () => void;
  }) => (
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
}));

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), prefetch: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the centered setup card for a DRAFT app, with no top bar', () => {
    mockUseAiAppReturn = { app: buildApp({ status: 'DRAFT', providedEnvVars: [] }), isLoading: false, isError: false };

    render(<AiAppDetailPage uid="app-1" />);

    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('AppSecretsPanel')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /back to all/i })).not.toBeInTheDocument();
  });

  describe('healthy app top bar', () => {
    it('renders "back to all" pointing at the list route', () => {
      mockUseAiAppReturn = { app: buildApp(), isLoading: false, isError: false };
      render(<AiAppDetailPage uid="app-1" />);

      expect(screen.getByRole('link', { name: /back to all/i })).toHaveAttribute('href', '/pl-infra/ai-apps');
    });

    it('shows "App Details" only when the app has a one-pager, and opens the details modal', () => {
      mockUseAiAppReturn = { app: buildApp({ prd: 'https://bucket.s3.amazonaws.com/ai-app-prds/app-1.md' }), isLoading: false, isError: false };
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
});
