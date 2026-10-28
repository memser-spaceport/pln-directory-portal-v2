import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { McpConnectionsPage } from '@/components/page/settings/mcp';
import type { McpAccessRequest, McpConnection } from '@/services/mcp/types';

jest.mock('@/components/common/Drawer', () => ({
  Drawer: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div data-testid="drawer">{children}</div> : null,
}));

jest.mock('@/utils/common.utils', () => ({
  ...jest.requireActual('@/utils/common.utils'),
  triggerLoader: jest.fn(),
}));

const mockToastError = jest.fn();
jest.mock('@/components/core/ToastContainer', () => ({ toast: { error: (msg: string) => mockToastError(msg) } }));

const mockAnalytics = {
  onSetupSnippetCopied: jest.fn(),
  onConnectionsPageViewed: jest.fn(),
  onPermissionsDrawerOpened: jest.fn(),
  onScopeLevelsSaved: jest.fn(),
  onScopeLevelsSaveFailed: jest.fn(),
  onAccessRequestOpened: jest.fn(),
  onAuthorizationRevoked: jest.fn(),
  onAuthorizationRevokeFailed: jest.fn(),
};
jest.mock('@/analytics/mcp.analytics', () => ({ useMcpAnalytics: () => mockAnalytics }));

let mockSearch = new URLSearchParams();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: mockReplace, refresh: jest.fn() }),
  usePathname: () => '/settings/mcp',
  useSearchParams: () => mockSearch,
}));

let mockCanConnect = true;
jest.mock('@/services/rbac/hooks/useMcpAccess', () => ({
  useMcpAccess: () => ({ canConnect: mockCanConnect, isLoading: false, isError: false }),
}));

let mockConnections: { data?: McpConnection[]; isLoading: boolean; isSuccess: boolean; isError: boolean } = {
  data: [],
  isLoading: false,
  isSuccess: true,
  isError: false,
};
const mockRefetch = jest.fn();
jest.mock('@/services/mcp/hooks/useMcpConnections', () => ({
  useMcpConnections: () => ({ ...mockConnections, refetch: mockRefetch }),
}));

let mockRequest: { data?: McpAccessRequest | null; isLoading: boolean; isError: boolean } = {
  data: undefined,
  isLoading: false,
  isError: false,
};
jest.mock('@/services/mcp/hooks/useMcpAccessRequest', () => ({ useMcpAccessRequest: () => mockRequest }));

const mockSaveMutate = jest.fn();
let mockSaveState = { isPending: false, isError: false };
jest.mock('@/services/mcp/hooks/useUpdateMcpScopes', () => ({
  useUpdateMcpScopes: () => ({ mutate: mockSaveMutate, reset: jest.fn(), ...mockSaveState }),
}));

const mockRevokeMutate = jest.fn();
jest.mock('@/services/mcp/hooks/useRevokeMcpConnection', () => ({
  useRevokeMcpConnection: () => ({ mutate: mockRevokeMutate, isPending: false, variables: undefined }),
}));

const CODEX: McpConnection = {
  uid: 'auth-codex',
  clientName: 'Codex',
  connectedAt: '2026-10-20T10:00:00Z',
  lastUsedAt: '2026-10-27T10:00:00Z',
  status: 'active',
  scopes: [
    { key: 'search', label: 'Search', level: 'read', maxLevel: 'read', registryMax: 'read', lock: null },
    { key: 'forum', label: 'Forum', level: 'read', maxLevel: 'read', registryMax: 'read', lock: null },
    {
      key: 'investors',
      label: 'Investors and warm intros',
      level: 'read',
      maxLevel: 'write',
      registryMax: 'write',
      lock: null,
    },
    { key: 'ai_apps', label: 'AI Apps', level: 'read', maxLevel: 'read', registryMax: 'write', lock: 'admin' },
  ],
};
const CLAUDE: McpConnection = {
  ...CODEX,
  uid: 'auth-claude',
  clientName: 'Claude.ai',
  lastUsedAt: null,
  status: 'signin_expired',
  scopes: CODEX.scopes.map((s) => (s.key === 'investors' ? { ...s, level: 'write' } : s)),
};

function withConnections(data: McpConnection[]) {
  mockConnections = { data, isLoading: false, isSuccess: true, isError: false };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSearch = new URLSearchParams();
  mockCanConnect = true;
  mockRequest = { data: undefined, isLoading: false, isError: false };
  mockSaveState = { isPending: false, isError: false };
  withConnections([]);
});

describe('McpConnectionsPage', () => {
  it('shows how to connect and no permissions when nothing is connected', () => {
    render(<McpConnectionsPage />);
    expect(screen.getByText('Add a connection')).toBeInTheDocument();
    expect(screen.getByText('MCP server URL')).toBeInTheDocument();
    expect(screen.queryByText('Edit permissions')).not.toBeInTheDocument();
  });

  it('lists each connection with its status, dates and permission chips', () => {
    withConnections([CODEX, CLAUDE]);
    render(<McpConnectionsPage />);

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Sign-in expired')).toBeInTheDocument();
    expect(screen.getByText(/Reconnect from the client to use it again/)).toBeInTheDocument();
    expect(screen.getByText(/Last used Oct 27, 2026/)).toBeInTheDocument();
    // Codex is on the read template; Claude.ai has every scope at its maximum, which is the Read and write template.
    expect(screen.getByRole('button', { name: 'Read only (default). Edit permissions' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Read and write. Edit permissions' })).toBeInTheDocument();
    // The guide collapses once something is connected.
    expect(screen.queryByText('MCP server URL')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add a connection' })).toBeInTheDocument();
  });

  it('edits one connection in the drawer and saves all levels in one call', () => {
    withConnections([CODEX, CLAUDE]);
    render(<McpConnectionsPage />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit permissions' })[0]);

    const drawer = screen.getByTestId('drawer');
    const save = within(drawer).getByRole('button', { name: 'Save' });
    expect(save).toBeDisabled();

    // Admin-capped write is visible, disabled and explained.
    const aiApps = within(drawer).getByRole('radiogroup', { name: 'Access to AI Apps' });
    expect(within(aiApps).getByRole('radio', { name: 'Read and write' })).toBeDisabled();
    expect(within(drawer).getByText('Turned off by LabOS admins.')).toBeInTheDocument();
    // A scope without write tools offers no write option.
    const search = within(drawer).getByRole('radiogroup', { name: 'Access to Search' });
    expect(within(search).queryByRole('radio', { name: 'Read and write' })).not.toBeInTheDocument();

    const investors = within(drawer).getByRole('radiogroup', { name: 'Access to Investors and warm intros' });
    fireEvent.click(within(investors).getByRole('radio', { name: 'Read and write' }));
    expect(save).toBeEnabled();
    fireEvent.click(save);

    expect(mockSaveMutate).toHaveBeenCalledWith(
      {
        uid: 'auth-codex',
        levels: { search: 'read', forum: 'read', investors: 'write', ai_apps: 'read' },
        requestUid: undefined,
      },
      expect.any(Object),
    );
    mockSaveMutate.mock.calls[0][1].onSuccess();
    expect(mockAnalytics.onScopeLevelsSaved).toHaveBeenCalledWith(
      expect.objectContaining({ changes: [{ scope: 'investors', from: 'read', to: 'write' }], viaRequest: false }),
    );
  });

  it('keeps the drawer and the draft when the save fails', () => {
    withConnections([CODEX]);
    mockSaveState = { isPending: false, isError: true };
    render(<McpConnectionsPage />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit permissions' })[0]);
    expect(screen.getByTestId('drawer')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Couldn’t save these permissions');
  });

  it('opens the drawer preset from an open access request and sends its id on save', () => {
    withConnections([CODEX]);
    mockSearch = new URLSearchParams('request=req-1');
    mockRequest = {
      data: {
        uid: 'req-1',
        authorizationUid: 'auth-codex',
        scope: 'investors',
        level: 'write',
        toolName: 'submit_warm_path_note',
        status: 'open',
        createdAt: '2026-10-28T08:00:00Z',
      },
      isLoading: false,
      isError: false,
    };
    render(<McpConnectionsPage />);

    const drawer = screen.getByTestId('drawer');
    expect(
      within(drawer).getByText('Codex asked for read and write access to Investors and warm intros'),
    ).toBeInTheDocument();
    const investors = within(drawer).getByRole('radiogroup', { name: 'Access to Investors and warm intros' });
    expect(within(investors).getByRole('radio', { name: 'Read and write' })).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(within(drawer).getByRole('button', { name: 'Save' }));
    expect(mockSaveMutate).toHaveBeenCalledWith(
      expect.objectContaining({ uid: 'auth-codex', requestUid: 'req-1' }),
      expect.any(Object),
    );
    expect(mockAnalytics.onAccessRequestOpened).toHaveBeenCalledWith({ status: 'open', scope: 'investors' });
  });

  it.each([
    ['expired', { status: 'expired' as const }, 'This access request has expired'],
    ['resolved', { status: 'resolved' as const }, 'already allowed'],
    ['for a revoked connection', { authorizationUid: 'gone' }, 'isn’t available'],
    ['for an admin-capped scope', { scope: 'ai_apps' as const }, 'turned off'],
  ])('shows a note and no drawer for a request %s', (_label, overrides, text) => {
    withConnections([CODEX]);
    mockSearch = new URLSearchParams('request=req-1');
    mockRequest = {
      data: {
        uid: 'req-1',
        authorizationUid: 'auth-codex',
        scope: 'investors',
        level: 'write',
        toolName: 'x',
        status: 'open',
        createdAt: '2026-10-20T08:00:00Z',
        ...overrides,
      },
      isLoading: false,
      isError: false,
    };
    render(<McpConnectionsPage />);
    expect(screen.getByRole('status')).toHaveTextContent(text);
    expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();
  });

  it('shows an error with Retry when the list fails', () => {
    mockConnections = { data: undefined, isLoading: false, isSuccess: false, isError: true };
    render(<McpConnectionsPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('shows a note instead of connections without mcp.connect', () => {
    mockCanConnect = false;
    render(<McpConnectionsPage />);
    expect(screen.getByText('MCP connections aren’t available for your account yet.')).toBeInTheDocument();
    expect(screen.queryByText('MCP server URL')).not.toBeInTheDocument();
  });

  it('revokes after the inline confirm and shows a toast when it fails', () => {
    withConnections([CODEX]);
    render(<McpConnectionsPage />);
    fireEvent.click(screen.getByRole('button', { name: 'More actions for Codex' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Revoke' }));
    const confirm = screen.getByRole('dialog', { name: 'Revoke Codex' });
    fireEvent.click(within(confirm).getByRole('button', { name: 'Revoke' }));

    expect(mockRevokeMutate).toHaveBeenCalledWith('auth-codex', expect.any(Object));
    mockRevokeMutate.mock.calls[0][1].onError();
    expect(mockToastError).toHaveBeenCalledWith('Couldn’t revoke Codex. Please try again.');
  });
});
