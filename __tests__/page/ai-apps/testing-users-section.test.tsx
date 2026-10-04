import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import { ManageAccessModal } from '@/components/page/ai-apps/AiAppsPage/components/ManageAccessModal';
import { parseTestingUsersCount } from '@/components/page/ai-apps/AiAppsPage/components/ManageAccessModal/components/TestingUsersSection/TestingUsersSection';
import { AiApp, AiAppAccessSettings, AiAppTargetView } from '@/services/ai-apps/ai-apps.service';
import { AiAppTestingUser } from '@/services/ai-apps/testing-users.service';

let mockSettings: AiAppAccessSettings | null = null;
let mockAccessError: string | null = null;
jest.mock('@/services/ai-apps/hooks/useAiAppAccess', () => ({
  useAiAppAccess: () => ({ settings: mockSettings, error: mockAccessError, isLoading: false }),
}));

jest.mock('@/services/ai-apps/hooks/useSaveAiAppAccess', () => ({
  useSaveAiAppAccess: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

jest.mock('@/services/ai-apps/hooks/useAiAppAccessCandidates', () => ({
  useAiAppAccessCandidates: () => ({ results: [], isSearching: false, isIdle: true }),
}));

let mockTestingUsers: AiAppTestingUser[] | null = [];
const mockCreate = jest.fn();
const mockRevoke = jest.fn();
jest.mock('@/services/ai-apps/hooks/useAiAppTestingUsers', () => ({
  useAiAppTestingUsers: () => ({ testingUsers: mockTestingUsers, error: null, isLoading: false }),
  useCreateAiAppTestingUsers: () => ({ mutateAsync: mockCreate, isPending: false }),
  useRevokeAiAppTestingUser: () => ({ mutateAsync: mockRevoke, isPending: false }),
}));

const mockMint = jest.fn();
jest.mock('@/services/ai-apps/testing-users.service', () => ({
  ...jest.requireActual('@/services/ai-apps/testing-users.service'),
  mintAiAppTestingUserAccess: (...args: unknown[]) => mockMint(...args),
}));

const mockAnalytics = {
  onManageAccessOpened: jest.fn(),
  onTestingUsersOpened: jest.fn(),
  onAccessSaved: jest.fn(),
  onAccessSaveFailed: jest.fn(),
  onEnvironmentSelected: jest.fn(),
  onAccessRedeployPrompted: jest.fn(),
  onAccessRedeployClicked: jest.fn(),
  onAccessRedeployDismissed: jest.fn(),
};
jest.mock('@/analytics/ai-apps.analytics', () => ({
  useAiAppsAnalytics: () => mockAnalytics,
}));

const PREVIEW: AiAppTargetView = {
  environment: 'preview',
  status: 'READY',
  url: 'https://news-summarizer-preview.example',
  httpUrl: null,
  host: null,
  lastDeployedAt: '2026-10-01T00:00:00.000Z',
  serving: 'current',
  requiredEnvVars: [],
  providedEnvVars: [],
  hasBuild: true,
};

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
    deployments: { prod: { ...PREVIEW, environment: 'prod' }, preview: PREVIEW },
    ...overrides,
  };
}

const USER_1: AiAppTestingUser = {
  uid: 'tu-1',
  name: 'Testing user 1',
  createdAt: '2026-10-03T00:00:00.000Z',
  revokedAt: null,
};
const USER_2: AiAppTestingUser = {
  uid: 'tu-2',
  name: 'Testing user 2',
  createdAt: '2026-10-03T00:00:00.000Z',
  revokedAt: null,
};

function openPreviewTab() {
  fireEvent.click(screen.getByRole('tab', { name: 'Preview' }));
}

function section() {
  return screen.getByRole('region', { name: 'Testing users' });
}

describe('Testing users section in Manage access', () => {
  const onClose = jest.fn();
  const writeText = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSettings = { access: 'PRIVATE', directLinkGateReady: true, members: [] };
    mockAccessError = null;
    mockTestingUsers = [USER_1, USER_2];
    writeText.mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
  });

  it('shows on the Preview tab with the count, a create action, and get-token and revoke actions per testing user', () => {
    render(<ManageAccessModal app={buildApp()} onClose={onClose} />);
    expect(screen.queryByRole('region', { name: 'Testing users' })).not.toBeInTheDocument();

    openPreviewTab();

    const region = section();
    expect(within(region).getByText('2 testing users')).toBeInTheDocument();
    expect(within(region).getByRole('spinbutton', { name: /number of testing users/i })).toHaveValue(5);
    expect(within(region).getByRole('button', { name: /create testing users/i })).toBeInTheDocument();
    expect(within(region).getByRole('button', { name: /get tokens for all/i })).toBeInTheDocument();
    expect(within(region).getByRole('button', { name: 'Get token for Testing user 1' })).toBeInTheDocument();
    expect(within(region).getByRole('button', { name: 'Revoke Testing user 2' })).toBeInTheDocument();
  });

  it('is absent for an app without a Preview environment', () => {
    render(
      <ManageAccessModal
        app={buildApp({ deployments: { prod: { ...PREVIEW, environment: 'prod' }, preview: null } })}
        onClose={onClose}
      />,
    );
    openPreviewTab();
    expect(screen.queryByRole('region', { name: 'Testing users' })).not.toBeInTheDocument();
  });

  it('is absent for a preview target that was never uploaded or deployed', () => {
    const empty = { ...PREVIEW, url: null, lastDeployedAt: null, hasBuild: false };
    render(
      <ManageAccessModal
        app={buildApp({ deployments: { prod: { ...PREVIEW, environment: 'prod' }, preview: empty } })}
        onClose={onClose}
      />,
    );
    openPreviewTab();
    expect(screen.queryByRole('region', { name: 'Testing users' })).not.toBeInTheDocument();
  });

  it('is absent for a member who is not the owner or a directory admin (access settings refused)', () => {
    mockSettings = null;
    mockAccessError = 'Only the app creator or a directory admin can manage access.';
    render(<ManageAccessModal app={buildApp()} onClose={onClose} />);
    openPreviewTab();
    expect(screen.queryByRole('region', { name: 'Testing users' })).not.toBeInTheDocument();
  });

  it('shows an empty state with the create action and no get-tokens action when there are none', () => {
    mockTestingUsers = [];
    render(<ManageAccessModal app={buildApp()} onClose={onClose} />);
    openPreviewTab();

    const region = section();
    expect(within(region).getByText('0 testing users')).toBeInTheDocument();
    expect(within(region).getByText(/no testing users yet/i)).toBeInTheDocument();
    expect(within(region).getByRole('button', { name: /create testing users/i })).toBeInTheDocument();
    expect(within(region).queryByRole('button', { name: /get token/i })).not.toBeInTheDocument();
  });

  it('marks revoked testing users and counts only active ones', () => {
    mockTestingUsers = [USER_1, { ...USER_2, revokedAt: '2026-10-04T00:00:00.000Z' }];
    render(<ManageAccessModal app={buildApp()} onClose={onClose} />);
    openPreviewTab();

    const region = section();
    expect(within(region).getByText('1 testing user')).toBeInTheDocument();
    expect(within(region).getByText('Revoked')).toBeInTheDocument();
    expect(within(region).queryByRole('button', { name: 'Revoke Testing user 2' })).not.toBeInTheDocument();
  });

  it('creates the chosen number of testing users', async () => {
    mockCreate.mockResolvedValue({ data: [], error: null });
    render(<ManageAccessModal app={buildApp()} onClose={onClose} />);
    openPreviewTab();

    fireEvent.change(screen.getByRole('spinbutton', { name: /number of testing users/i }), {
      target: { value: '12' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create testing users/i }));

    await waitFor(() => expect(mockCreate).toHaveBeenCalledWith(12));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('refuses a count outside 1 to 100 before calling the backend', async () => {
    render(<ManageAccessModal app={buildApp()} onClose={onClose} />);
    openPreviewTab();

    fireEvent.change(screen.getByRole('spinbutton', { name: /number of testing users/i }), {
      target: { value: '101' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create testing users/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a whole number from 1 to 100.');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('shows the cap error in plain words and leaves the list unchanged', async () => {
    mockCreate.mockResolvedValue({
      data: null,
      error: 'You can have at most 100 testing users for this app. Revoke one to create another.',
    });
    render(<ManageAccessModal app={buildApp()} onClose={onClose} />);
    openPreviewTab();

    fireEvent.click(screen.getByRole('button', { name: /create testing users/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'You can have at most 100 testing users for this app. Revoke one to create another.',
    );
    expect(within(section()).getByText('2 testing users')).toBeInTheDocument();
  });

  it('revokes one testing user', async () => {
    mockRevoke.mockResolvedValue({ data: { uid: 'tu-2', revokedAt: '2026-10-04T00:00:00.000Z' }, error: null });
    render(<ManageAccessModal app={buildApp()} onClose={onClose} />);
    openPreviewTab();

    fireEvent.click(screen.getByRole('button', { name: 'Revoke Testing user 2' }));

    await waitFor(() => expect(mockRevoke).toHaveBeenCalledWith('tu-2'));
  });

  it('shows a refusal from the backend in plain words', async () => {
    mockRevoke.mockResolvedValue({
      data: null,
      error: 'Only the app owner or a directory admin can manage testing users.',
    });
    render(<ManageAccessModal app={buildApp()} onClose={onClose} />);
    openPreviewTab();

    fireEvent.click(screen.getByRole('button', { name: 'Revoke Testing user 1' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Only the app owner or a directory admin can manage testing users.',
    );
  });

  it('shows tokens once with copy and copy-all, says so, and drops them on close', async () => {
    mockMint.mockResolvedValue({
      data: [
        { uid: 'tu-1', name: 'Testing user 1', token: 'tok-one', expiresAt: '2026-10-05T10:00:00.000Z' },
        { uid: 'tu-2', name: 'Testing user 2', token: 'tok-two', expiresAt: '2026-10-05T10:00:00.000Z' },
      ],
      error: null,
    });
    render(<ManageAccessModal app={buildApp()} onClose={onClose} />);
    openPreviewTab();

    fireEvent.click(screen.getByRole('button', { name: /get tokens for all/i }));

    expect(await screen.findByText('tok-one')).toBeInTheDocument();
    expect(mockMint).toHaveBeenCalledWith('app-1', undefined);
    expect(screen.getByText(/shown only once/i)).toBeInTheDocument();
    expect(screen.getByText(/24 hours/i)).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy token for Testing user 2' }));
    });
    expect(writeText).toHaveBeenLastCalledWith('tok-two');
    expect(screen.getByRole('status')).toHaveTextContent('Token copied to the clipboard.');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy all' }));
    });
    expect(writeText).toHaveBeenLastCalledWith('Testing user 1\ttok-one\nTesting user 2\ttok-two');
    expect(screen.getByRole('status')).toHaveTextContent('All tokens copied to the clipboard.');

    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(screen.queryByText('tok-one')).not.toBeInTheDocument());
    expect(onClose).not.toHaveBeenCalled();
  });

  it('gets the token of one testing user', async () => {
    mockMint.mockResolvedValue({
      data: [{ uid: 'tu-1', name: 'Testing user 1', token: 'tok-one', expiresAt: '2026-10-05T10:00:00.000Z' }],
      error: null,
    });
    render(<ManageAccessModal app={buildApp()} onClose={onClose} />);
    openPreviewTab();

    fireEvent.click(screen.getByRole('button', { name: 'Get token for Testing user 1' }));

    expect(await screen.findByText('tok-one')).toBeInTheDocument();
    expect(mockMint).toHaveBeenCalledWith('app-1', ['tu-1']);
  });

  it('says so when the clipboard refuses', async () => {
    writeText.mockRejectedValue(new Error('denied'));
    mockMint.mockResolvedValue({
      data: [{ uid: 'tu-1', name: 'Testing user 1', token: 'tok-one', expiresAt: '2026-10-05T10:00:00.000Z' }],
      error: null,
    });
    render(<ManageAccessModal app={buildApp()} onClose={onClose} />);
    openPreviewTab();
    fireEvent.click(screen.getByRole('button', { name: 'Get token for Testing user 1' }));
    await screen.findByText('tok-one');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy token for Testing user 1' }));
    });
    expect(screen.getByRole('status')).toHaveTextContent(/could not copy/i);
  });

  it('fires ai-apps-testing-users-opened once per modal open', () => {
    render(<ManageAccessModal app={buildApp()} onClose={onClose} />);
    openPreviewTab();
    fireEvent.click(screen.getByRole('tab', { name: 'Production' }));
    openPreviewTab();

    expect(mockAnalytics.onTestingUsersOpened).toHaveBeenCalledTimes(1);
    expect(mockAnalytics.onTestingUsersOpened).toHaveBeenCalledWith('app-1');
  });
});

describe('parseTestingUsersCount', () => {
  it.each([
    ['1', 1],
    ['100', 100],
    [' 7 ', 7],
    ['0', null],
    ['101', null],
    ['2.5', null],
    ['-3', null],
    ['', null],
  ])('%p -> %p', (input, expected) => {
    expect(parseTestingUsersCount(input)).toBe(expected);
  });
});
