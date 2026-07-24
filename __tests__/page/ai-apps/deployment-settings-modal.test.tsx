import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { DeploymentSettingsModal } from '@/components/page/ai-apps/AiAppsPage/components/DeploymentSettingsModal';
import { AiApp } from '@/services/ai-apps/ai-apps.service';

const mockAnalytics = {
  onDeploymentSettingsOpened: jest.fn(),
  onSecretsDeployClicked: jest.fn(),
  onSecretsDeploySucceeded: jest.fn(),
  onSecretsDeployFailed: jest.fn(),
};
jest.mock('@/analytics/ai-apps.analytics', () => ({
  useAiAppsAnalytics: () => mockAnalytics,
}));

const mockDeployAiApp = jest.fn();
jest.mock('@/services/ai-apps/ai-apps.service', () => ({
  ...jest.requireActual('@/services/ai-apps/ai-apps.service'),
  deployAiApp: (...args: unknown[]) => mockDeployAiApp(...args),
}));

let mockUseAiAppReturn: { app: AiApp | null };
jest.mock('@/services/ai-apps/hooks/useAiApp', () => ({
  useAiApp: () => mockUseAiAppReturn,
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
    url: null,
    httpUrl: null,
    host: null,
    port: null,
    deploymentId: 'deploy-1',
    requiredEnvVars: [],
    providedEnvVars: [],
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    member: { uid: 'member-1', name: 'Ada', image: null },
    ...overrides,
  };
}

describe('DeploymentSettingsModal — onDeployingChange', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fires true synchronously on click — before the deploy request resolves', async () => {
    let resolveDeploy!: (value: { app: AiApp; error: null }) => void;
    mockDeployAiApp.mockReturnValue(
      new Promise((resolve) => {
        resolveDeploy = resolve;
      }),
    );
    const app = buildApp();
    mockUseAiAppReturn = { app };
    const onDeployingChange = jest.fn();

    render(<DeploymentSettingsModal app={app} onClose={onClose} onDeployingChange={onDeployingChange} />);

    fireEvent.click(screen.getByRole('button', { name: /^redeploy$/i }));

    // Fired synchronously off the click — well before the network call below resolves.
    expect(onDeployingChange).toHaveBeenCalledWith(true);

    resolveDeploy({ app: { ...app, status: 'DEPLOYING' }, error: null });
    await waitFor(() => expect(screen.getByText(/redeploying news summarizer/i)).toBeInTheDocument());
  });

  it('resets to false on unmount even if dismissed mid-deploy', () => {
    mockDeployAiApp.mockReturnValue(new Promise(() => {})); // never resolves
    const app = buildApp();
    mockUseAiAppReturn = { app };
    const onDeployingChange = jest.fn();

    const { unmount } = render(
      <DeploymentSettingsModal app={app} onClose={onClose} onDeployingChange={onDeployingChange} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /^redeploy$/i }));
    expect(onDeployingChange).toHaveBeenLastCalledWith(true);

    unmount();
    expect(onDeployingChange).toHaveBeenLastCalledWith(false);
  });

  it('omitting onDeployingChange (the grid usage) does not throw', () => {
    mockDeployAiApp.mockReturnValue(new Promise(() => {}));
    const app = buildApp();
    mockUseAiAppReturn = { app };

    render(<DeploymentSettingsModal app={app} onClose={onClose} />);

    expect(() => fireEvent.click(screen.getByRole('button', { name: /^redeploy$/i }))).not.toThrow();
  });

  it('labels the action "Deploy" for a never-deployed draft, not "Redeploy"', () => {
    mockDeployAiApp.mockReturnValue(new Promise(() => {}));
    const app = buildApp({ status: 'DRAFT', requiredEnvVars: ['OPENAI_API_KEY'], providedEnvVars: [] });
    mockUseAiAppReturn = { app };

    render(<DeploymentSettingsModal app={app} onClose={onClose} />);

    expect(screen.getByRole('button', { name: /^deploy$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^redeploy$/i })).not.toBeInTheDocument();
  });
});
