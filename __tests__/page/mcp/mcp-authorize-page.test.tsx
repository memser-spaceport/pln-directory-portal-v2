import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { McpAuthorizePage } from '@/components/page/mcp/McpAuthorizePage/McpAuthorizePage';

const mockAnalytics = {
  onConnectPageViewed: jest.fn(),
  onConnectSignInClicked: jest.fn(),
  onConnectApproved: jest.fn(),
  onConnectDenied: jest.fn(),
  onConnectError: jest.fn(),
};

const mockPush = jest.fn();
const mockApprove = jest.fn();
const mockFetchClient = jest.fn();
const mockUseCurrentUserStore = jest.fn();
const mockUseMcpAccess = jest.fn();
let searchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), prefetch: jest.fn() }),
  useSearchParams: () => searchParams,
}));

jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => mockUseCurrentUserStore(),
}));

jest.mock('@/services/rbac/hooks/useMcpAccess', () => ({
  useMcpAccess: () => mockUseMcpAccess(),
}));

jest.mock('@/services/mcp/mcp.service', () => ({
  approveMcpOAuth: (...args: unknown[]) => mockApprove(...args),
  fetchMcpOAuthClient: (...args: unknown[]) => mockFetchClient(...args),
}));

jest.mock('@/analytics/mcp.analytics', () => ({
  useMcpAnalytics: () => mockAnalytics,
}));

const VALID_PARAMS = {
  client_id: 'mcp_client_abc',
  redirect_uri: 'http://127.0.0.1:9/cb',
  code_challenge: 'challenge',
  code_challenge_method: 'S256',
};

function setParams(params: Record<string, string>) {
  searchParams = new URLSearchParams(params);
}

describe('McpAuthorizePage analytics', () => {
  const locationAssign = jest.fn();

  beforeAll(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { assign: locationAssign, pathname: '/mcp/authorize', search: '' },
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    setParams(VALID_PARAMS);
    mockUseCurrentUserStore.mockReturnValue({
      currentUser: { uid: 'u1', name: 'Ada' },
      isHydrated: true,
    });
    mockUseMcpAccess.mockReturnValue({ canConnect: true, isLoading: false });
    mockFetchClient.mockResolvedValue({
      client_id: 'mcp_client_abc',
      client_name: 'Claude Code',
      redirect_host: '127.0.0.1',
      redirect_uri_registered: true,
    });
  });

  it('fires page viewed for the pending consent view', async () => {
    render(<McpAuthorizePage />);

    await waitFor(() => {
      expect(mockAnalytics.onConnectPageViewed).toHaveBeenCalledWith({
        view: 'pending',
        clientId: 'mcp_client_abc',
      });
    });
    expect(mockAnalytics.onConnectPageViewed).toHaveBeenCalledTimes(1);
  });

  it('fires sign-in clicked from the signed-out view', async () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: null, isHydrated: true });
    render(<McpAuthorizePage />);

    await waitFor(() => {
      expect(mockAnalytics.onConnectPageViewed).toHaveBeenCalledWith({
        view: 'signedOut',
        clientId: 'mcp_client_abc',
      });
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in to continue' }));
    expect(mockAnalytics.onConnectSignInClicked).toHaveBeenCalledWith({ clientId: 'mcp_client_abc' });
  });

  it('fires denied with missing_permission when the user cannot connect', async () => {
    mockUseMcpAccess.mockReturnValue({ canConnect: false, isLoading: false });
    render(<McpAuthorizePage />);

    await waitFor(() => {
      expect(mockAnalytics.onConnectPageViewed).toHaveBeenCalledWith({
        view: 'denied',
        clientId: 'mcp_client_abc',
      });
    });
    expect(mockAnalytics.onConnectDenied).toHaveBeenCalledWith({
      clientId: 'mcp_client_abc',
      reason: 'missing_permission',
    });
  });

  it('fires approved before redirecting on Allow', async () => {
    mockApprove.mockResolvedValue({ redirectUrl: 'http://127.0.0.1:9/cb?code=1' });
    render(<McpAuthorizePage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Allow' }));

    await waitFor(() => {
      expect(mockAnalytics.onConnectApproved).toHaveBeenCalledWith({ clientId: 'mcp_client_abc' });
    });
    expect(locationAssign).toHaveBeenCalledWith('http://127.0.0.1:9/cb?code=1');
  });

  it('asks for read-only access by default and sends allowChanges false', async () => {
    mockApprove.mockResolvedValue({ redirectUrl: 'http://127.0.0.1:9/cb?code=1' });
    render(<McpAuthorizePage />);

    expect(await screen.findByText('Read the directory, events and forum')).toBeInTheDocument();
    const changes = screen.getByRole('checkbox', { name: 'Make changes for me (feedback status, introductions)' });
    expect(changes).not.toBeChecked();

    fireEvent.click(screen.getByRole('button', { name: 'Allow' }));

    await waitFor(() => expect(mockApprove).toHaveBeenCalledTimes(1));
    expect(mockApprove).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 'mcp_client_abc', allowChanges: false }),
    );
  });

  it('sends allowChanges true when the member ticks Make changes for me', async () => {
    mockApprove.mockResolvedValue({ redirectUrl: 'http://127.0.0.1:9/cb?code=1' });
    render(<McpAuthorizePage />);

    const changes = await screen.findByRole('checkbox', {
      name: 'Make changes for me (feedback status, introductions)',
    });
    fireEvent.click(changes);
    expect(changes).toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Allow' }));

    await waitFor(() => expect(mockApprove).toHaveBeenCalledTimes(1));
    expect(mockApprove).toHaveBeenCalledWith(expect.objectContaining({ allowChanges: true }));
  });

  it('shows the registered name and host and ignores client_name in the URL', async () => {
    setParams({ ...VALID_PARAMS, client_name: 'Claude Official' });
    mockFetchClient.mockResolvedValue({
      client_id: 'mcp_client_abc',
      client_name: 'Evil Tool',
      redirect_host: '127.0.0.1',
      redirect_uri_registered: true,
    });
    render(<McpAuthorizePage />);

    expect(await screen.findByText('Evil Tool')).toBeInTheDocument();
    expect(screen.getByText('127.0.0.1')).toBeInTheDocument();
    expect(screen.queryByText('Claude Official')).not.toBeInTheDocument();
  });

  it('shows an error with no actions for an unknown client', async () => {
    setParams({ ...VALID_PARAMS, client_name: 'Claude Official' });
    mockFetchClient.mockResolvedValue({ error: 'not_found' });
    render(<McpAuthorizePage />);

    expect(await screen.findByText('This connect link is not valid. Ask your agent to try again.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Allow' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Deny' })).not.toBeInTheDocument();
    expect(screen.queryByText('Claude Official')).not.toBeInTheDocument();
    expect(mockAnalytics.onConnectError).toHaveBeenCalledWith({
      clientId: 'mcp_client_abc',
      errorKind: 'client_unknown',
    });
  });

  it('shows an error with no actions for an unregistered redirect', async () => {
    mockFetchClient.mockResolvedValue({
      client_id: 'mcp_client_abc',
      client_name: 'Evil Tool',
      redirect_host: null,
      redirect_uri_registered: false,
    });
    render(<McpAuthorizePage />);

    expect(await screen.findByText('This connect link is not valid. Ask your agent to try again.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Allow' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Deny' })).not.toBeInTheDocument();
    expect(mockAnalytics.onConnectError).toHaveBeenCalledWith({
      clientId: 'mcp_client_abc',
      errorKind: 'redirect_invalid',
    });
    expect(locationAssign).not.toHaveBeenCalled();
  });

  it('shows an error with no actions for a non-http redirect that is not registered', async () => {
    setParams({ ...VALID_PARAMS, redirect_uri: 'javascript:alert(1)' });
    mockFetchClient.mockResolvedValue({
      client_id: 'mcp_client_abc',
      client_name: 'Evil Tool',
      redirect_host: null,
      redirect_uri_registered: false,
    });
    render(<McpAuthorizePage />);

    expect(await screen.findByText('This connect link is not valid. Ask your agent to try again.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Allow' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Deny' })).not.toBeInTheDocument();
    expect(locationAssign).not.toHaveBeenCalled();
  });

  it('fires denied with user_denied on Deny and returns to the registered http redirect', async () => {
    setParams({ ...VALID_PARAMS, state: 'xyz' });
    render(<McpAuthorizePage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Deny' }));

    expect(mockAnalytics.onConnectDenied).toHaveBeenCalledWith({
      clientId: 'mcp_client_abc',
      reason: 'user_denied',
    });
    expect(locationAssign).toHaveBeenCalledWith('http://127.0.0.1:9/cb?error=access_denied&state=xyz');
  });

  it('shows a close-this-tab message for a registered private-use redirect and does not navigate', async () => {
    setParams({ ...VALID_PARAMS, redirect_uri: 'cursor://anysphere.cursor-mcp/oauth/callback' });
    mockFetchClient.mockResolvedValue({
      client_id: 'mcp_client_abc',
      client_name: 'Cursor',
      redirect_host: null,
      redirect_uri_registered: true,
    });
    render(<McpAuthorizePage />);

    expect(await screen.findByText('Cursor')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Deny' }));

    expect(await screen.findByText('You can close this tab.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Allow' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Deny' })).not.toBeInTheDocument();
    expect(locationAssign).not.toHaveBeenCalled();
  });

  it('fires approve_failed on Allow error', async () => {
    mockApprove.mockResolvedValue({ error: 'failed' });
    render(<McpAuthorizePage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Allow' }));

    await waitFor(() => {
      expect(mockAnalytics.onConnectError).toHaveBeenCalledWith({
        clientId: 'mcp_client_abc',
        errorKind: 'approve_failed',
      });
    });
    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
  });

  it('fires invalid view when OAuth params are missing', () => {
    setParams({});
    render(<McpAuthorizePage />);

    expect(mockAnalytics.onConnectPageViewed).toHaveBeenCalledWith({
      view: 'invalid',
      clientId: '',
    });
  });
});
