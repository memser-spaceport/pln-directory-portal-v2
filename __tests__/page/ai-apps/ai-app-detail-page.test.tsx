import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { AiAppDetailPage } from '@/components/page/ai-apps/AiAppDetailPage';
import { AiApp } from '@/services/ai-apps/ai-apps.service';

const mockAnalytics = {
  onDetailPageViewed: jest.fn(),
  onDraftSetupViewed: jest.fn(),
  onIframeLoadFailed: jest.fn(),
  onIframeLoaded: jest.fn(),
  onSecretsPanelOpened: jest.fn(),
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

// AppSecretsPanel's own behavior (locking, deploy flow) is covered by its own
// test file — here we only need to trigger its callback props to verify how
// AiAppDetailPage reacts to them.
jest.mock('@/components/page/ai-apps/AiAppDetailPage/components/AppSecretsPanel', () => ({
  AppSecretsPanel: ({
    onDeployingChange,
    onDeploySucceeded,
  }: {
    onDeployingChange?: (deploying: boolean) => void;
    onDeploySucceeded?: () => void;
  }) => (
    <div>
      <span>AppSecretsPanel</span>
      <button type="button" onClick={() => onDeployingChange?.(true)}>
        Simulate deploy start
      </button>
      <button
        type="button"
        onClick={() => {
          onDeploySucceeded?.();
          onDeployingChange?.(false);
        }}
      >
        Simulate deploy success
      </button>
    </div>
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
    member: { uid: 'member-1', name: 'Ada' },
    ...overrides,
  };
}

describe('AiAppDetailPage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the centered setup card (not a collapsible bar) for a DRAFT app', () => {
    mockUseAiAppReturn = { app: buildApp({ status: 'DRAFT', providedEnvVars: [] }), isLoading: false, isError: false };

    render(<AiAppDetailPage uid="app-1" />);

    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('AppSecretsPanel')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Back to app' })).not.toBeInTheDocument();
  });

  it('shows the "Update secrets & redeploy" entry point for a READY app, and swaps to the full centered card on click', () => {
    mockUseAiAppReturn = { app: buildApp(), isLoading: false, isError: false };

    render(<AiAppDetailPage uid="app-1" />);

    expect(screen.queryByText('AppSecretsPanel')).not.toBeInTheDocument();
    const trigger = screen.getByRole('button', { name: 'Update secrets & redeploy' });

    fireEvent.click(trigger);

    expect(screen.getByText('AppSecretsPanel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to app' })).toBeInTheDocument();
    expect(mockAnalytics.onSecretsPanelOpened).toHaveBeenCalledWith({ appUid: 'app-1', isDraft: false });
  });

  it('"Back to app" returns to the running-app view', async () => {
    mockUseAiAppReturn = { app: buildApp(), isLoading: false, isError: false };

    render(<AiAppDetailPage uid="app-1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Update secrets & redeploy' }));
    fireEvent.click(screen.getByRole('button', { name: 'Back to app' }));

    expect(screen.queryByText('AppSecretsPanel')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Update secrets & redeploy' })).toBeInTheDocument());
  });

  it('disables "Back to app" while a deploy from the panel is in flight, and it does nothing if clicked', () => {
    mockUseAiAppReturn = { app: buildApp(), isLoading: false, isError: false };

    render(<AiAppDetailPage uid="app-1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Update secrets & redeploy' }));
    fireEvent.click(screen.getByRole('button', { name: 'Simulate deploy start' }));

    const backButton = screen.getByRole('button', { name: 'Back to app' });
    expect(backButton).toBeDisabled();

    fireEvent.click(backButton);
    expect(screen.getByText('AppSecretsPanel')).toBeInTheDocument();
  });

  it('returns to the running-app view once the panel reports a successful deploy', () => {
    mockUseAiAppReturn = { app: buildApp(), isLoading: false, isError: false };

    render(<AiAppDetailPage uid="app-1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Update secrets & redeploy' }));
    fireEvent.click(screen.getByRole('button', { name: 'Simulate deploy success' }));

    expect(screen.queryByText('AppSecretsPanel')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update secrets & redeploy' })).toBeInTheDocument();
  });

  it('does not show the secrets entry point for a non-creator viewer', () => {
    mockUseAiAppReturn = {
      app: buildApp({ canManage: false, member: { uid: 'someone-else', name: 'Bea' } }),
      isLoading: false,
      isError: false,
    };

    render(<AiAppDetailPage uid="app-1" />);

    expect(screen.queryByRole('button', { name: 'Update secrets & redeploy' })).not.toBeInTheDocument();
  });
});
