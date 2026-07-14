import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { AppSecretsPanel } from '@/components/page/ai-apps/AiAppDetailPage/components/AppSecretsPanel';
import { clearSecretsDraft } from '@/components/page/ai-apps/AiAppDetailPage/components/AppSecretsPanel/secretsDraftCache';
import { deployAiApp, AiApp } from '@/services/ai-apps/ai-apps.service';

const mockInvalidateQueries = jest.fn();
const mockAnalytics = {
  onSecretsDeployClicked: jest.fn(),
  onSecretsDeploySucceeded: jest.fn(),
};

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

jest.mock('@/analytics/ai-apps.analytics', () => ({
  useAiAppsAnalytics: () => mockAnalytics,
}));

jest.mock('@/services/ai-apps/ai-apps.service', () => ({
  ...jest.requireActual('@/services/ai-apps/ai-apps.service'),
  deployAiApp: jest.fn(),
}));

const mockDeployAiApp = deployAiApp as jest.MockedFunction<typeof deployAiApp>;

function buildApp(overrides: Partial<AiApp> = {}): AiApp {
  return {
    uid: 'app-1',
    memberUid: 'member-1',
    appId: 'news-summarizer',
    name: 'News Summarizer',
    description: 'Summarize recent news.',
    status: 'DRAFT',
    notes: null,
    url: null,
    httpUrl: null,
    host: null,
    port: null,
    deploymentId: 'deploy-1',
    requiredEnvVars: ['PERPLEXITY_API_KEY'],
    providedEnvVars: [],
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    member: { uid: 'member-1', name: 'Ada' },
    ...overrides,
  };
}

describe('AppSecretsPanel', () => {
  afterEach(() => {
    jest.clearAllMocks();
    clearSecretsDraft('app-1');
  });

  it('renders a plain required input and a Deploy button for a var with no stored value', () => {
    render(<AppSecretsPanel app={buildApp()} />);

    expect(screen.getByPlaceholderText('Required')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Deploy' })).toBeInTheDocument();
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  it('renders a stored var as a locked masked row, and reveals an input on Edit', () => {
    render(<AppSecretsPanel app={buildApp({ status: 'READY', providedEnvVars: ['PERPLEXITY_API_KEY'] })} />);

    expect(screen.getByText('••••••••••••••••')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Enter new value')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    const input = screen.getByPlaceholderText('Enter new value');
    expect(input).toBeInTheDocument();
    expect(input).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Cancel — keep stored value' })).toBeInTheDocument();
  });

  it('editing one field does not affect a sibling field', () => {
    render(
      <AppSecretsPanel
        app={buildApp({
          status: 'READY',
          requiredEnvVars: ['PERPLEXITY_API_KEY', 'NEWS_FEED_TOKEN'],
          providedEnvVars: ['PERPLEXITY_API_KEY', 'NEWS_FEED_TOKEN'],
        })}
      />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0]);

    expect(screen.getAllByText('••••••••••••••••')).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Edit' })).toHaveLength(1);
  });

  it('Cancel reverts the field to locked, clears the typed value, and refocuses Edit', async () => {
    render(<AppSecretsPanel app={buildApp({ status: 'READY', providedEnvVars: ['PERPLEXITY_API_KEY'] })} />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByPlaceholderText('Enter new value'), { target: { value: 'new-secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel — keep stored value' }));

    expect(screen.queryByPlaceholderText('Enter new value')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Edit' })).toHaveFocus());
  });

  it('shows Deploy for a DRAFT app even with partial stored vars, and Re-deploy for a non-DRAFT app', () => {
    const { rerender } = render(
      <AppSecretsPanel app={buildApp({ status: 'DRAFT', providedEnvVars: ['PERPLEXITY_API_KEY'] })} />,
    );
    expect(screen.getByRole('button', { name: 'Deploy' })).toBeInTheDocument();

    rerender(<AppSecretsPanel app={buildApp({ status: 'ERROR', providedEnvVars: [] })} />);
    expect(screen.getByRole('button', { name: 'Re-deploy' })).toBeInTheDocument();
  });

  it('shows an inline error when a required var has no value', () => {
    render(<AppSecretsPanel app={buildApp()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Deploy' }));

    expect(screen.getByText('Enter a value for: PERPLEXITY_API_KEY')).toBeInTheDocument();
    expect(mockDeployAiApp).not.toHaveBeenCalled();
  });

  it('restores pasted values after the panel remounts', () => {
    const { unmount } = render(<AppSecretsPanel app={buildApp()} />);
    fireEvent.change(screen.getByPlaceholderText('Required'), { target: { value: 'sk-pasted' } });
    unmount();

    render(<AppSecretsPanel app={buildApp()} />);
    expect(screen.getByPlaceholderText('Required')).toHaveValue('sk-pasted');
  });

  it('on success, clears values and editing so the field returns to locked', async () => {
    mockDeployAiApp.mockResolvedValue({ app: buildApp(), error: null });

    render(<AppSecretsPanel app={buildApp({ status: 'READY', providedEnvVars: ['PERPLEXITY_API_KEY'] })} />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByPlaceholderText('Enter new value'), { target: { value: 'new-secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Re-deploy' }));

    await waitFor(() => expect(mockDeployAiApp).toHaveBeenCalledWith('app-1', { PERPLEXITY_API_KEY: 'new-secret' }));
    await waitFor(() => expect(screen.getByText('••••••••••••••••')).toBeInTheDocument());
    expect(mockInvalidateQueries).toHaveBeenCalledTimes(2);
  });

  it('on failure, keeps the field unlocked with its typed value and shows the error', async () => {
    mockDeployAiApp.mockResolvedValue({ app: null, error: 'Sandbox rejected the key.' });

    render(<AppSecretsPanel app={buildApp({ status: 'READY', providedEnvVars: ['PERPLEXITY_API_KEY'] })} />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByPlaceholderText('Enter new value'), { target: { value: 'new-secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Re-deploy' }));

    await waitFor(() => expect(screen.getByText('Sandbox rejected the key.')).toBeInTheDocument());
    expect(screen.getByPlaceholderText('Enter new value')).toHaveValue('new-secret');
  });

  it('calls onDeploySucceeded only after a successful deploy, once the deploying flag has cleared', async () => {
    const onDeploySucceeded = jest.fn();
    const onDeployingChange = jest.fn();
    mockDeployAiApp.mockResolvedValue({ app: buildApp(), error: null });

    render(
      <AppSecretsPanel
        app={buildApp({ status: 'READY', providedEnvVars: ['PERPLEXITY_API_KEY'] })}
        onDeployingChange={onDeployingChange}
        onDeploySucceeded={onDeploySucceeded}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Re-deploy' }));

    await waitFor(() => expect(onDeploySucceeded).toHaveBeenCalledTimes(1));
    // onDeployingChange(false) must have already fired by the time onDeploySucceeded runs.
    expect(onDeployingChange).toHaveBeenLastCalledWith(false);
  });

  it('does not call onDeploySucceeded when the deploy fails', async () => {
    const onDeploySucceeded = jest.fn();
    mockDeployAiApp.mockResolvedValue({ app: null, error: 'Sandbox rejected the key.' });

    render(
      <AppSecretsPanel
        app={buildApp({ status: 'READY', providedEnvVars: ['PERPLEXITY_API_KEY'] })}
        onDeploySucceeded={onDeploySucceeded}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Re-deploy' }));

    await waitFor(() => expect(screen.getByText('Sandbox rejected the key.')).toBeInTheDocument());
    expect(onDeploySucceeded).not.toHaveBeenCalled();
  });
});
