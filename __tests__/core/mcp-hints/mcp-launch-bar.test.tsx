import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { McpLaunchBar } from '@/components/core/mcp-hints/McpLaunchBar';
import { MCP_CONNECTIONS_NEW_FLAG } from '@/utils/mcp';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

let mockShowMcpPage = true;
jest.mock('@/utils/mcp', () => ({
  MCP_CONNECTIONS_NEW_FLAG: 'mcp_connections_new',
  MCP_LAUNCH_BAR_FLAG: 'mcp_launch_bar',
  get SHOW_MCP_CONNECTIONS_PAGE() {
    return mockShowMcpPage;
  },
}));

let mockCanConnect = true;
jest.mock('@/services/rbac/hooks/useMcpAccess', () => ({
  useMcpAccess: () => ({ canConnect: mockCanConnect, isLoading: false, isError: false, isFetched: true }),
}));

let mockConnections: Array<{ uid: string; clientName: string; status: string }> | undefined = [];
const mockUseMcpConnections = jest.fn();
jest.mock('@/services/mcp/hooks/useMcpConnections', () => ({
  useMcpConnections: (enabled: boolean) => {
    mockUseMcpConnections(enabled);
    return { data: enabled ? mockConnections : undefined, isSuccess: enabled && mockConnections !== undefined };
  },
}));

// Each flag key answers on its own, so "page opened" and "bar closed" can be set apart.
const mockFlags: Record<string, boolean> = {};
const mockDismiss: Record<string, jest.Mock> = {};
jest.mock('@/hooks/useOneTimeCallout', () => ({
  useOneTimeCallout: (key: string) => {
    mockDismiss[key] ??= jest.fn();
    return { open: mockFlags[key] ?? false, dismiss: mockDismiss[key] };
  },
}));

const mockAnalytics = {
  onHintShown: jest.fn(),
  onHintDismissed: jest.fn(),
  onHintConnectClicked: jest.fn(),
};
jest.mock('@/analytics/mcp.analytics', () => ({
  useMcpAnalytics: () => mockAnalytics,
}));

const LAUNCH_FLAG = 'mcp_launch_bar';
const TEXT =
  'Search teams and members, post news or reply in the forum right from your AI session. LabOS now works with AI agents.';

beforeEach(() => {
  jest.clearAllMocks();
  mockShowMcpPage = true;
  mockCanConnect = true;
  mockConnections = [];
  mockFlags[LAUNCH_FLAG] = true;
  mockFlags[MCP_CONNECTIONS_NEW_FLAG] = true;
});

describe('McpLaunchBar (LAB-3033)', () => {
  it('announces MCP to a member who can connect and has no agent yet, and reports it once', () => {
    const { rerender } = render(<McpLaunchBar />);
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText(TEXT)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Set up now' })).toBeInTheDocument();
    rerender(<McpLaunchBar />);
    expect(mockAnalytics.onHintShown).toHaveBeenCalledTimes(1);
    expect(mockAnalytics.onHintShown).toHaveBeenCalledWith({ context: 'launch_bar', connected: false });
  });

  it.each([
    ['without mcp.connect (not an admin or PL infra)', () => (mockCanConnect = false)],
    ['while the MCP connections page is flagged off', () => (mockShowMcpPage = false)],
    [
      'once an agent is connected',
      () => (mockConnections = [{ uid: 'a1', clientName: 'Claude Code', status: 'active' }]),
    ],
    ['before the connections have loaded', () => (mockConnections = undefined)],
    ['after the member opened MCP connections', () => (mockFlags[MCP_CONNECTIONS_NEW_FLAG] = false)],
    ['after the member closed it', () => (mockFlags[LAUNCH_FLAG] = false)],
  ])('stays hidden %s', (_label, setup) => {
    setup();
    const { container } = render(<McpLaunchBar />);
    expect(container).toBeEmptyDOMElement();
    expect(mockAnalytics.onHintShown).not.toHaveBeenCalled();
  });

  it('does not ask for connections when the member cannot connect', () => {
    mockCanConnect = false;
    render(<McpLaunchBar />);
    expect(mockUseMcpConnections).toHaveBeenCalledWith(false);
  });

  it('opens Settings → MCP connections from "Set up now"', () => {
    render(<McpLaunchBar />);
    fireEvent.click(screen.getByRole('button', { name: 'Set up now' }));
    expect(mockPush).toHaveBeenCalledWith('/settings/mcp');
    expect(mockAnalytics.onHintConnectClicked).toHaveBeenCalledWith({ context: 'launch_bar' });
  });

  it('closes for good from ✕', () => {
    render(<McpLaunchBar />);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(mockDismiss[LAUNCH_FLAG]).toHaveBeenCalledTimes(1);
    expect(mockDismiss[MCP_CONNECTIONS_NEW_FLAG]).not.toHaveBeenCalled();
    expect(mockAnalytics.onHintDismissed).toHaveBeenCalledWith({ context: 'launch_bar' });
  });
});
