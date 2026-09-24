import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { ManageAccessModal } from '@/components/page/ai-apps/AiAppsPage/components/ManageAccessModal';
import { AiApp, AiAppAccessCandidate, AiAppAccessSettings } from '@/services/ai-apps/ai-apps.service';

let mockSettings: AiAppAccessSettings | null = null;
jest.mock('@/services/ai-apps/hooks/useAiAppAccess', () => ({
  useAiAppAccess: () => ({ settings: mockSettings, error: null, isLoading: false }),
}));

const mockMutateAsync = jest.fn();
jest.mock('@/services/ai-apps/hooks/useSaveAiAppAccess', () => ({
  useSaveAiAppAccess: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
}));

let mockCandidates: AiAppAccessCandidate[] = [];
jest.mock('@/services/ai-apps/hooks/useAiAppAccessCandidates', () => ({
  useAiAppAccessCandidates: (_uid: string, term: string) => ({
    results: term.length >= 2 ? mockCandidates : [],
    isSearching: false,
    isIdle: term.length < 2,
  }),
}));

const mockAnalytics = {
  onManageAccessOpened: jest.fn(),
  onAccessSaved: jest.fn(),
  onAccessSaveFailed: jest.fn(),
  onAccessRedeployPrompted: jest.fn(),
  onAccessRedeployClicked: jest.fn(),
  onAccessRedeployDismissed: jest.fn(),
};
jest.mock('@/analytics/ai-apps.analytics', () => ({
  useAiAppsAnalytics: () => mockAnalytics,
}));

function buildApp(overrides: Partial<AiApp> = {}): AiApp {
  return {
    uid: 'app-1',
    memberUid: 'owner-1',
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
    lastDeployedAt: '2026-07-01T00:00:00.000Z',
    access: 'PRIVATE',
    member: { uid: 'owner-1', name: 'Ada', image: null },
    ...overrides,
  };
}

const BOB = { uid: 'bob', name: 'Bob', image: null, addedAt: '2026-09-01T00:00:00.000Z' };

describe('ManageAccessModal', () => {
  const onClose = jest.fn();
  const onRedeploy = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSettings = { access: 'PRIVATE', directLinkGateReady: true, members: [BOB] };
    mockCandidates = [];
  });

  it('shows the owner and whitelisted members, and keeps Save disabled until something changes', () => {
    render(<ManageAccessModal app={buildApp()} onClose={onClose} />);

    expect(screen.getByRole('radio', { name: /private/i })).toBeChecked();
    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.getByText('Owner')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^save$/i })).toBeDisabled();
  });

  it('adds a member from search and saves the whole list', async () => {
    mockCandidates = [
      { uid: 'cara', name: 'Cara', image: null, teamName: 'PL', hasAiAppsAccess: true, alreadyAdded: false },
      { uid: 'dan', name: 'Dan', image: null, teamName: null, hasAiAppsAccess: false, alreadyAdded: false },
    ];
    mockMutateAsync.mockResolvedValue({ data: { ...mockSettings, members: [] }, error: null });
    render(<ManageAccessModal app={buildApp()} onClose={onClose} />);

    const search = screen.getByRole('combobox');
    fireEvent.change(search, { target: { value: 'ca' } });
    expect(screen.getByText('No AI Apps access')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole('option', { name: /dan/i }));
    fireEvent.mouseDown(screen.getByRole('option', { name: /cara/i }));
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() =>
      expect(mockMutateAsync).toHaveBeenCalledWith({ access: 'PRIVATE', memberUids: ['bob', 'cara'] }),
    );
    expect(onClose).toHaveBeenCalled();
    expect(mockAnalytics.onAccessSaved).toHaveBeenCalledWith({
      appUid: 'app-1',
      from: 'PRIVATE',
      to: 'PRIVATE',
      addedCount: 1,
      removedCount: 0,
      whitelistSize: 2,
    });
  });

  it('removes a member', async () => {
    mockMutateAsync.mockResolvedValue({ data: { ...mockSettings, members: [] }, error: null });
    render(<ManageAccessModal app={buildApp()} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /remove bob/i }));
    expect(screen.getByText(/only you can see this app/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledWith({ access: 'PRIVATE', memberUids: [] }));
  });

  it('switching to all PL Infra members hides the list but keeps it', async () => {
    mockMutateAsync.mockResolvedValue({ data: { ...mockSettings, access: 'OPEN' }, error: null });
    render(<ManageAccessModal app={buildApp()} onClose={onClose} />);

    fireEvent.click(screen.getByRole('radio', { name: /all pl infra members/i }));
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
    expect(screen.getByText(/your list of 1 person is kept/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledWith({ access: 'OPEN', memberUids: ['bob'] }));
  });

  it('shows the save error inline and stays open', async () => {
    mockMutateAsync.mockResolvedValue({ data: null, error: 'Some members cannot be added to this app' });
    render(<ManageAccessModal app={buildApp()} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /remove bob/i }));
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    expect(await screen.findByText('Some members cannot be added to this app')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(mockAnalytics.onAccessSaveFailed).toHaveBeenCalledWith('app-1');
  });

  it('offers a redeploy after saving Private on an app deployed before per-app access', async () => {
    mockSettings = { access: 'OPEN', directLinkGateReady: false, members: [] };
    mockMutateAsync.mockResolvedValue({
      data: { access: 'PRIVATE', directLinkGateReady: false, members: [] },
      error: null,
    });
    render(<ManageAccessModal app={buildApp({ access: 'OPEN' })} onClose={onClose} onRedeploy={onRedeploy} />);

    fireEvent.click(screen.getByRole('radio', { name: /private/i }));
    expect(screen.getByText(/direct link stays open to PL Infra members until you redeploy/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    fireEvent.click(await screen.findByRole('button', { name: /redeploy now/i }));
    expect(onRedeploy).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(mockAnalytics.onAccessRedeployPrompted).toHaveBeenCalledWith('app-1');
    expect(mockAnalytics.onAccessRedeployClicked).toHaveBeenCalledWith('app-1');
  });

  it('never warns about the direct link for an app that has not shipped yet', () => {
    mockSettings = { access: 'OPEN', directLinkGateReady: false, members: [] };
    render(
      <ManageAccessModal
        app={buildApp({ access: 'OPEN', status: 'DRAFT', lastDeployedAt: null })}
        onClose={onClose}
        onRedeploy={onRedeploy}
      />,
    );

    fireEvent.click(screen.getByRole('radio', { name: /private/i }));
    expect(screen.queryByText(/until you redeploy/i)).not.toBeInTheDocument();
  });
});
