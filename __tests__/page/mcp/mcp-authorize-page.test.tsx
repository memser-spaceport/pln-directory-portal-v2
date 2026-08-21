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
  });

  it('fires page viewed for the pending consent view', () => {
    render(<McpAuthorizePage />);

    expect(mockAnalytics.onConnectPageViewed).toHaveBeenCalledTimes(1);
    expect(mockAnalytics.onConnectPageViewed).toHaveBeenCalledWith({
      view: 'pending',
      clientId: 'mcp_client_abc',
    });
  });

  it('fires sign-in clicked from the signed-out view', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: null, isHydrated: true });
    render(<McpAuthorizePage />);

    expect(mockAnalytics.onConnectPageViewed).toHaveBeenCalledWith({
      view: 'signedOut',
      clientId: 'mcp_client_abc',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in to continue' }));
    expect(mockAnalytics.onConnectSignInClicked).toHaveBeenCalledWith({ clientId: 'mcp_client_abc' });
  });

  it('fires denied with missing_permission when the user cannot connect', () => {
    mockUseMcpAccess.mockReturnValue({ canConnect: false, isLoading: false });
    render(<McpAuthorizePage />);

    expect(mockAnalytics.onConnectPageViewed).toHaveBeenCalledWith({
      view: 'denied',
      clientId: 'mcp_client_abc',
    });
    expect(mockAnalytics.onConnectDenied).toHaveBeenCalledWith({
      clientId: 'mcp_client_abc',
      reason: 'missing_permission',
    });
  });

  it('fires approved before redirecting on Allow', async () => {
    mockApprove.mockResolvedValue({ redirectUrl: 'http://127.0.0.1:9/cb?code=1' });
    render(<McpAuthorizePage />);

    fireEvent.click(screen.getByRole('button', { name: 'Allow' }));

    await waitFor(() => {
      expect(mockAnalytics.onConnectApproved).toHaveBeenCalledWith({ clientId: 'mcp_client_abc' });
    });
    expect(locationAssign).toHaveBeenCalledWith('http://127.0.0.1:9/cb?code=1');
  });

  it('fires denied with user_denied on Deny', () => {
    render(<McpAuthorizePage />);

    fireEvent.click(screen.getByRole('button', { name: 'Deny' }));

    expect(mockAnalytics.onConnectDenied).toHaveBeenCalledWith({
      clientId: 'mcp_client_abc',
      reason: 'user_denied',
    });
    expect(locationAssign).toHaveBeenCalled();
  });

  it('fires approve_failed on Allow error', async () => {
    mockApprove.mockResolvedValue({ error: 'failed' });
    render(<McpAuthorizePage />);

    fireEvent.click(screen.getByRole('button', { name: 'Allow' }));

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
